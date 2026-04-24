import React, { useState } from 'react';
import { message } from 'antd';
import { X, Printer, Download, Mail, CheckCircle, Package, Star, User, CreditCard, ArrowLeft, ArrowRight, Loader2, ShoppingCart, Settings, History } from 'lucide-react';
// import { loadStripe } from "@stripe/stripe-js";
import { useRef } from 'react';
import { useEffect } from 'react';
import { placeOrder, createCheckoutSession } from '../api/api';
import useSettingsStore from '../store/settingsStore';
// const stripePromise = loadStripe("pk_test_51S0HgS2ZnQzLDaK40M9tlj1n72wtQNsUNhG986xbE6bfHxWmFfOMJfWGAbg4QrAlFtnhVCtOajoIqUbRgSBnRnkb00iMo1bD1o");

const QuoteModal = ({ 
  isOpen, 
  onClose, 
  selectedOptions, 
  defaultSelections = {}, 
  price, 
  amountPaid = 0,
  paymentStatus = 'unpaid',
  balanceDue = 0,
  editDeadline = null,
  onContinueConfiguring, 
  packageName, 
  program, 
  initialDeliveryDetails 
}) => {

  // Helper: Check if a garment has been actually configured (differs from defaults)
  const isGarmentConfigured = (garmentType, garmentData) => {
    const defaults = defaultSelections[garmentType];
    if (!defaults) return true;

    // Color aur Size global sync hain — inhe configured nahi maante
    // Sirf pressureOptions mein actual design changes hone par configured maano

    const currentPO = garmentData.pressureOptions || {};
    const defaultPO = defaults.pressureOptions || {};

    for (const key of Object.keys(currentPO)) {
      const currentVal = currentPO[key];
      const defaultVal = defaultPO[key];

      if (Array.isArray(currentVal)) {
        if (currentVal.length > 0) return true;
        continue;
      }
      if (currentVal !== null && typeof currentVal === 'object') {
        if (JSON.stringify(currentVal) !== JSON.stringify(defaultVal)) return true;
        continue;
      }
      if (currentVal !== '' && currentVal !== null && currentVal !== undefined && currentVal !== defaultVal) {
        return true;
      }
    }

    return false;
  };

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  
  // Track which garments are selected for purchase — start empty, user explicitly selects
  const [selectedGarments, setSelectedGarments] = useState(() => {
    const configured = {};
    Object.entries(selectedOptions).forEach(([type, options]) => {
      configured[type] = isGarmentConfigured(type, options);
    });
    return configured;
  });

  const [customerDetails, setCustomerDetails] = useState({
    firstName: initialDeliveryDetails?.firstName || '',
    lastName: initialDeliveryDetails?.lastName || '',
    email: initialDeliveryDetails?.email || '',
    phone: initialDeliveryDetails?.phone || '',
    Skolenavn: initialDeliveryDetails?.Skolenavn || '',
    address: initialDeliveryDetails?.address || '',
    city: initialDeliveryDetails?.city || '',
    postalCode: initialDeliveryDetails?.postalCode || '',
    country: initialDeliveryDetails?.country || 'Denmark',
    notes: initialDeliveryDetails?.notes || '',
    deliveryType: initialDeliveryDetails?.deliveryType || "regular",
    deliverToSchool: initialDeliveryDetails?.deliverToSchool || false
  });

  // Sync state if initialDeliveryDetails changes while modal is open (e.g. slow fetch)
  useEffect(() => {
    if (initialDeliveryDetails) {
      setCustomerDetails(prev => ({
        ...prev,
        ...initialDeliveryDetails
      }));
    }
  }, [initialDeliveryDetails]);

  // --- outside renderCustomerDetails, in your component ---
  const refs = {
    firstName: useRef(null),
    lastName: useRef(null),
    email: useRef(null),
    phone: useRef(null),
    Skolenavn: useRef(null),
    address: useRef(null),
    city: useRef(null),
    country: useRef(null),
    postalCode: useRef(null),
    notes: useRef(null),
  };

  // Ordered list of refs (for enter + click navigation)
  const refOrder = [
    refs.firstName,
    refs.lastName,
    refs.email,
    refs.phone,
    refs.Skolenavn,
    refs.address,
    refs.city,
    refs.postalCode,
    refs.country,
    refs.notes,
  ];

  const lastFocusedIndex = useRef(-1);

  // Track which field was last focused - ONLY on step 1
  useEffect(() => {
    if (currentStep !== 1) return;
    console.log('first');

    const handleFocus = (index) => {
      lastFocusedIndex.current = index;
      console.log('second');
    };

    // Add focus event listeners to all refs
    refOrder.forEach((ref, index) => {
      if (ref.current) {
        ref.current.addEventListener("focus", () => handleFocus(index));
        console.log('third');
      }
    });

    return () => {
      // Cleanup focus event listeners
      refOrder.forEach((ref) => {
        if (ref.current) {
          ref.current.removeEventListener("focus", () => { });
          console.log('fourth');
        }
      });
    };
  }, [currentStep]); // Re-run when step changes

  // Click outside → focus next field - ONLY on step 1
  useEffect(() => {
    if (currentStep !== 1) return;

    const handleClick = (e) => {
      // Don't trigger if clicking on form elements or buttons
      if (e.target.matches('input, textarea, select')) {
        return;
      }
      // If we have a last focused field and it's not the last one
      if (lastFocusedIndex.current >= 0 && lastFocusedIndex.current < refOrder.length - 1) {
        const nextIndex = lastFocusedIndex.current + 1;
        refOrder[nextIndex].current?.focus();
      } else if (lastFocusedIndex.current === -1) {
        // No field focused yet, focus first field
        refOrder[0].current?.focus();
      }
      // If lastFocusedIndex.current is the last field, do nothing
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [currentStep]); // Re-run when step changes

  const [orderDate, setOrderDate] = useState(`ORD-${Date.now().toString()}`);

  // Garment prices from backend settings (with fallback) — must be before any early return
  const { getGarmentPrice, getVat } = useSettingsStore();
  const GARMENT_PRICES = {
    'T-SHIRT':      getGarmentPrice('T-SHIRT')      || 1200,
    'SWEATSHIRT':   getGarmentPrice('SWEATSHIRT')   || 1500,
    'HOODIE':       getGarmentPrice('HOODIE')        || 2000,
    'ZIPPERHOODIE': getGarmentPrice('ZIPPERHOODIE') || 2200,
    'SWEATPANTS':   getGarmentPrice('SWEATPANTS')   || 2000,
    'SHORTS':       getGarmentPrice('SHORTS')        || 1500,
  };

  if (!isOpen) return null;

  const steps = orderComplete ? ['Thank You'] : ['Order Overview', 'Delivery Information', 'Order Confirmation'];

  // ✨ NEW: Calculate dynamic total price
  const calculateTotalPrice = () => {
    let total = 0;
    Object.entries(selectedGarments).forEach(([garmentType, isSelected]) => {
      if (isSelected && isGarmentConfigured(garmentType, selectedOptions[garmentType])) {
        total += GARMENT_PRICES[garmentType] || 0;
      }
    });
    return total;
  };

  const dynamicPrice = calculateTotalPrice();
  
  // VAT calculation
  const subtotal = dynamicPrice;
  const vatPct = getVat(); // e.g. 10
  const vatAmount = Math.round(subtotal * vatPct / 100);
  const totalWithVat = subtotal + vatAmount;

  // Balance due = total with VAT - already paid amount
  const computedBalanceDue = Math.max(0, totalWithVat - amountPaid);

  // ✨ NEW: Toggle garment selection
  const toggleGarmentSelection = (garmentType) => {
    setSelectedGarments(prev => ({
      ...prev,
      [garmentType]: !prev[garmentType]
    }));
  };

  // Price definitions for each option
  const priceConfig = {
    basePrice: 299,
    bows: {
      color: {
        "Standard": 0,
        "Premium": 50,
        "Luxury": 100
      },
      bowType: {
        "Standard": 0,
        "Premium": 75,
        "Luxury": 150
      },
      emblem: {
        "Standard": 0,
        "Premium": 60,
        "Luxury": 120
      },
      country: {
        "Denmark": 0,
        "Sweden": 25,
        "Norway": 25,
        "Germany": 25,
        "Other": 30
      }
    },
    educationalTape: {
      hatbandColor: {
        "Standard": 0,
        "Premium": 40,
        "Luxury": 80
      },
      materialType: {
        "Standard": 0,
        "Premium": 55,
        "Luxury": 110
      },
      chinStrapColor: {
        "Standard": 0,
        "Premium": 30,
        "Luxury": 60
      },
      buttonMaterial: {
        "Standard": 0,
        "Premium": 20,
        "Luxury": 40
      },
      embroideryColor: {
        "Standard": 0,
        "Premium": 35,
        "Luxury": 70
      },
      buttonColor: {
        "Standard": 0,
        "Premium": 15,
        "Luxury": 30
      },
      embroideryText: {
        "Standard": 0,
        "Premium": 25,
        "Luxury": 50
      }
    },
    embroidery: {
      nameEmbroideryColor: {
        "Standard": 0,
        "Premium": 45,
        "Luxury": 90
      },
      nameEmbroideryText: {
        "Standard": 0,
        "Premium": 25,
        "Luxury": 50
      },
      schoolEmbroideryColor: {
        "Standard": 0,
        "Premium": 45,
        "Luxury": 90
      },
      schoolEmbroideryText: {
        "Standard": 0,
        "Premium": 25,
        "Luxury": 50
      }
    },
    cover: {
      coverColor: {
        "Standard": 0,
        "Premium": 70,
        "Luxury": 140
      },
      edgebandColor: {
        "Standard": 0,
        "Premium": 40,
        "Luxury": 80
      },
      starsStyle: {
        "Standard": 0,
        "Premium": 50,
        "Luxury": 100
      }
    },
    shade: {
      shadeType: {
        "Standard": 0,
        "Premium": 85,
        "Luxury": 170
      },
      materialType: {
        "Standard": 0,
        "Premium": 60,
        "Luxury": 120
      },
      shadowTapeColor: {
        "Standard": 0,
        "Premium": 35,
        "Luxury": 70
      },
      engravingLine1: {
        "Standard": 0,
        "Premium": 15,
        "Luxury": 30
      },
      engravingLine2: {
        "Standard": 0,
        "Premium": 15,
        "Luxury": 30
      },
      engravingLine3: {
        "Standard": 0,
        "Premium": 15,
        "Luxury": 30
      }
    },
    foer: {
      kokardeMaterial: {
        "Standard": 0,
        "Premium": 50,
        "Luxury": 100
      },
      kokardeColor: {
        "Standard": 0,
        "Premium": 30,
        "Luxury": 60
      },
      bowColor: {
        "Standard": 0,
        "Premium": 40,
        "Luxury": 80
      },
      foerMaterial: {
        "Standard": 0,
        "Premium": 65,
        "Luxury": 130
      },
      bowMaterialType: {
        "Standard": 0,
        "Premium": 45,
        "Luxury": 90
      }
    },
    extraCover: {
      extraCoverOption: {
        "None": 0,
        "Standard": 50,
        "Premium": 100,
        "Luxury": 200
      }
    },
    accessories: {
      hatBoxColor: {
        "Standard": 0,
        "Premium": 25,
        "Luxury": 50
      },
      hatBoxType: {
        "None": 0,
        "Standard": 50,
        "Premium": 100,
        "Luxury": 200
      },
      ballpointPenSelection: {
        "None": 0,
        "Standard": 20,
        "Premium": 40
      },
      silkPillowSelection: {
        "None": 0,
        "Standard": 30,
        "Premium": 60
      },
      badgesSelection: {
        "None": 0,
        "Standard": 25,
        "Premium": 50
      },
      glovesSelection: {
        "None": 0,
        "Standard": 35,
        "Premium": 70
      },
      largeBallpointPenSelection: {
        "None": 0,
        "Standard": 30,
        "Premium": 60
      },
      smartTagSelection: {
        "None": 0,
        "Standard": 15,
        "Premium": 30
      },
      lightBallSelection: {
        "None": 0,
        "Standard": 40,
        "Premium": 80
      },
      champagneGlassSelection: {
        "None": 0,
        "Standard": 25,
        "Premium": 50
      },
      whistleSelection: {
        "None": 0,
        "Standard": 20,
        "Premium": 40
      },
      trumpetSelection: {
        "None": 0,
        "Standard": 80,
        "Premium": 160
      }
    },
    size: {
      selectedSize: {
        "49.5": 0,
        "50": 0,
        "51": 0,
        "52": 0,
        "53": 0,
        "54": 0,
        "55": 0,
        "56": 0,
        "57": 0,
        "58": 0,
        "59": 0,
        "60": 0,
        "61": 0
      },
      millimeterAdjustment: {
        "0": 0,
        "5": 10,
        "10": 20,
        "15": 30
      }
    }
  };

  // Function to calculate total price


  // Function to format values for display
  const formatValue = (value, section, key) => {
    let displayValue = '';
    let price = 0;

    if (typeof value === 'object' && value.name) {
      displayValue = value.name;
      if (priceConfig[section] && priceConfig[section][key] && priceConfig[section][key][value.name] !== undefined) {
        price = priceConfig[section][key][value.name];
      }
    } else if (typeof value === 'string') {
      displayValue = value;
      if (priceConfig[section] && priceConfig[section][key] && priceConfig[section][key][value] !== undefined) {
        price = priceConfig[section][key][value];
      }
    } else if (typeof value === 'number') {
      displayValue = value.toString();
      if (priceConfig[section] && priceConfig[section][key] && priceConfig[section][key][value.toString()] !== undefined) {
        price = priceConfig[section][key][value.toString()];
      }
    }

    if (displayValue === '' || displayValue === 'Ikke valgt') {
      return 'Ikke valgt';
    }

    if (price > 0) {
      return `${displayValue} (+${price} DKK)`;
    }

    return displayValue;
  };

  // Filter out empty or default values for cleaner display
  //   const filterOptions = (options) => {
  //   // Define relationships between text fields and their color fields
  //   const relatedPairs = {
  //     "Broderi foran": "Broderi farve",
  //     "Navne broderi": "Broderifarve",
  //     "Skolebroderi": "Skolebroderi farve",
  //   };

  //   // First, make a shallow copy so we can safely delete keys
  //   const filtered = { ...options };

  //   // Loop through each related pair
  //   for (const [textKey, colorKey] of Object.entries(relatedPairs)) {
  //     if (filtered[textKey] === "") {
  //       // If the main text field is empty, remove its color field
  //       delete filtered[colorKey];
  //     }
  //   }

  //   // Now remove unwanted keys and empty/null values
  //   return Object.fromEntries(
  //     Object.entries(filtered).filter(([key, value]) => {
  //       if (key === "Ingen") return false;
  //       if (value === null || value === undefined) return false;
  //       if (typeof value === "object" && (!value.name || value.name === "")) return false;
  //       // Keep empty strings for display logic if needed
  //       return true;
  //     })
  //   );
  // };

  const filterOptions = (options) => {
    // 1. Common Logic: Filter out empty strings from the start
    const filtered = {};
    Object.entries(options).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        filtered[key] = value;
      }
    });

    // 2. Legacy Cap Logic (Safely handled)
    const relatedPairs = {
      "Broderi foran": "Broderi farve",
      "Navne broderi": "Broderifarve",
      "Skolebroderi": "Skolebroderi farve",
    };

    for (const [textKey, colorKey] of Object.entries(relatedPairs)) {
      if (filtered[textKey] === undefined && filtered[colorKey]) {
        delete filtered[colorKey];
      }
    }

    // Safety check BEFORE accessing deep nested keys like SKYGGE
    // Using optional chaining or straight up checks to prevent 'undefined' access errors
    if (selectedOptions && selectedOptions.SKYGGE && selectedOptions.SKYGGE.Type === "Glimmer") {
      delete selectedOptions.SKYGGE.Materiale;
    }

    // Safety check for TILBEHØR
    if (selectedOptions && selectedOptions.TILBEHØR) {
      if (selectedOptions.TILBEHØR['Ekstra korkarde'] == "Fravalgt" || selectedOptions.TILBEHØR['Ekstra korkarde'] == "No") {
        delete selectedOptions.TILBEHØR['Ekstra korkarde Text'];
      }
      if (selectedOptions.TILBEHØR['Lille Flag'] == "Fravalgt" || selectedOptions.TILBEHØR['Lille Flag'] == "No") {
        delete selectedOptions.TILBEHØR['Lille Flag Text'];
      }
    }


    if (options.pressureOptions) {
      const po = options.pressureOptions;
      if (po.rightChestText) filtered['Right Chest (Text)'] = po.rightChestText;
      if (po.rightChestFlag) filtered['Right Chest (Flag)'] = po.rightChestFlag;
      if (po.leftChestText) filtered['Left Chest (Text)'] = po.leftChestText;
      if (po.leftChestFlag) filtered['Left Chest (Flag)'] = po.leftChestFlag;

      if (po.bottomChestText) filtered['Bottom Chest (Text)'] = po.bottomChestText;
      
      if (po.rightSleeveText) filtered['Right Sleeve (Text)'] = po.rightSleeveText;
      if (po.rightSleeveFlag) filtered['Right Sleeve (Flag)'] = po.rightSleeveFlag;
      if (po.leftSleeveText) filtered['Left Sleeve (Text)'] = po.leftSleeveText;
      if (po.leftSleeveFlag) filtered['Left Sleeve (Flag)'] = po.leftSleeveFlag;

      if (po.rightLegText) filtered['Right Leg (Text)'] = po.rightLegText;
      if (po.rightLegFlag) filtered['Right Leg (Flag)'] = po.rightLegFlag;
      if (po.leftLegText) filtered['Left Leg (Text)'] = po.leftLegText;
      if (po.leftLegFlag) filtered['Left Leg (Flag)'] = po.leftLegFlag;

      if (po.backDesign) filtered['Back Design'] = po.backDesign.name || 'Custom';

      // Remove the raw object so it doesn't show up as [Object object]
      delete filtered.pressureOptions;
    }

    // Explicitly keep selectedColor/Size if they exist (they are already in filtered from step 1)
    if (options.selectedColor) filtered['Color'] = options.selectedColor;
    if (options.selectedSize) filtered['Size'] = options.selectedSize;

    // Cleanup: Remove raw selectedColor/Size keys if we mapped them to nice names
    if (filtered['Color']) delete filtered.selectedColor;
    if (filtered['Size']) delete filtered.selectedSize;


    // 4. Final Cleanup & Translation
    return Object.fromEntries(
      Object.entries(filtered).filter(([key, value]) => {
        if (key === "Ingen") return false;
        if (typeof value === "object" && (!value.name || value.name === "")) return false; // Filter empty objects
        return true;
      }).map(([key, value]) => {
        // Convert specific values
        if (typeof value === "string") {
          if (value.trim().toLowerCase() === "none") value = "NONE";
          else if (value.trim().toLowerCase() === "yes") value = "Yes";
          else if (value.trim().toLowerCase() === "no") value = "Deselected";
        }
        return [key, value];
      })
    );
  };




  // Handle input changes
  const handleInputChange = (field, value) => {
    setCustomerDetails(prev => ({
      ...prev,
      [field]: value
    }));

  };

  // Validate customer details
  const validateCustomerDetails = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode'];
    return required.every(field => customerDetails[field].trim() !== '');
  };
  const buildFilteredOptions = (selectedOptions) => {
    return Object.fromEntries(
      Object.entries(selectedOptions).map(([category, options]) => {
        return [category, filterOptions(options)];
      }).filter(([_, filtered]) => Object.keys(filtered).length > 0)
    );
  };

  const handleConfirmOrder = async () => {
    setIsLoading(true);

    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const studentId = user?.id;
      const classId = user?.class_id;

      if (!studentId || !classId) {
        throw new Error("Student or Class information not found. Please log in again.");
      }

      // Prepare order data
      const configuredEntries = Object.entries(selectedOptions).filter(
        ([type, options]) => isGarmentConfigured(type, options) && selectedGarments[type]
      );

      if (configuredEntries.length === 0) {
        throw new Error("No garments selected. Please select at least one garment before placing an order.");
      }

      const garments = configuredEntries.map(([type, options]) => ({
        product_type: type,
        selectedColor: options.selectedColor,
        selectedSize: options.selectedSize,
        design_config: options.pressureOptions || {}
      }));

      // Extract logo_id from any configured garment's pressureOptions
      let logo_id = null;
      for (const [, options] of configuredEntries) {
        if (options.pressureOptions?.selectedLogoId) {
          logo_id = options.pressureOptions.selectedLogoId;
          break;
        }
      }

      // Check if balance exists
      if (computedBalanceDue <= 0) {
        const saveResponse = await placeOrder({
          student_id: studentId,
          class_id: classId,
          garments,
          delivery_details: customerDetails,
          logo_id
        });

        if (saveResponse.data?.success) {
          message.success("Order details updated successfully!");
          setOrderComplete(true);
          return;
        }
      }

      // Prepare Stripe session
      const tempOrderData = {
        student_id: studentId,
        class_id: classId,
        garments: garments,
        delivery_details: customerDetails,
        logo_id
      };

      const stripeResponse = await createCheckoutSession({
        orderData: tempOrderData,
        amount: computedBalanceDue
      });

      if (stripeResponse.data?.success && stripeResponse.data?.url) {
        // window.location.href = stripeResponse.data.url;
        return;
      } else {
        if (stripeResponse.data?.message) {
          throw new Error(stripeResponse.data.message);
        } else {
          throw new Error("Failed to create Stripe checkout session");
        }
      }

    } catch (error) {
      console.error("Error during checkout:", error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error.message) {
        message.error(error.message);
      } else {
        message.error("An unexpected error occurred. Please try again.");
      }
      setIsLoading(false);
    }
  };

  // Reset modal to initial state
  const handleResetModal = () => {
    setCurrentStep(0);
    setIsLoading(false);
    setOrderComplete(false);
    setCustomerDetails({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      Skolenavn: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Denmark',
      notes: ''
    });
  };

  // Step 1: Quote Review (Original content)
  const renderQuoteReview = () => (
    <div className="overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar-premium">
      {/* ✨ NEW: Selection Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-blue-900 text-sm mb-1">Select Items to Purchase</h4>
            <p className="text-blue-700 text-xs">
              Click the checkbox on each garment card to select/deselect items for your order. 
              Price will update automatically based on your selection.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {Object.entries(selectedOptions).filter(([category, options]) => isGarmentConfigured(category, options)).map(([category, options], categoryIndex) => {
          const filteredOptions = filterOptions(options);

          if (Object.keys(filteredOptions).length === 0) return null;

          const isSelected = selectedGarments[category] || false;
          const garmentPrice = GARMENT_PRICES[category] || 0;

          return (
            <div
              key={category}
              className={`bg-white rounded-3xl p-6 shadow-sm border-2 transition-all duration-500 group overflow-hidden relative cursor-pointer ${
                isSelected 
                  ? 'border-green-500 shadow-xl shadow-green-200/50' 
                  : 'border-slate-200 hover:border-slate-300 opacity-60'
              }`}
              onClick={() => toggleGarmentSelection(category)}
            >
              {/* ✨ NEW: Selection Checkbox */}
              <div className="absolute top-4 right-4 z-20">
                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                  isSelected 
                    ? 'bg-green-600 border-green-600' 
                    : 'bg-white border-slate-300'
                }`}>
                  {isSelected && <CheckCircle className="w-5 h-5 text-white" />}
                </div>
              </div>

              {/* Background Accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 transition-colors duration-500 ${
                isSelected ? 'bg-green-50' : 'bg-slate-50'
              }`}></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-all duration-500 ${
                      isSelected 
                        ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-200' 
                        : 'bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-200'
                    }`}>
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-800 capitalize tracking-tight">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium">Custom Configuration</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-4 py-1.5 text-xs font-bold rounded-full border uppercase tracking-widest ${
                      isSelected 
                        ? 'bg-green-50 text-green-700 border-green-100' 
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {isSelected ? 'Selected' : 'Not Selected'}
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${isSelected ? 'text-green-600' : 'text-slate-400'}`}>
                        {garmentPrice}
                      </span>
                      <span className={`text-sm font-semibold ml-1 ${isSelected ? 'text-green-600' : 'text-slate-400'}`}>
                        DKK
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(filteredOptions).map(([key, value]) => (
                    <div
                      key={key}
                      className="group/item relative flex flex-col p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-green-100 hover:bg-white hover:shadow-md transition-all duration-300"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover/item:text-green-600 transition-colors">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm font-bold text-slate-700 group-hover/item:text-slate-900 transition-colors truncate">
                        {formatValue(value, category, key)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✨ NEW: No items selected warning */}
      {Object.values(selectedGarments).every(v => !v) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-6">
          <div className="flex items-start gap-3">
            <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-red-900 text-sm mb-1">No Items Selected</h4>
              <p className="text-red-700 text-xs">
                Please select at least one garment to continue with your order.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Step 2: Customer Details Form
  // Step 2: Customer Details Form
  const renderCustomerDetails = () => {
    const handleKeyPress = (e, currentFieldName) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const currentIndex = refOrder.findIndex(ref => ref.current?.name === currentFieldName);
        if (currentIndex >= 0 && currentIndex < refOrder.length - 1) {
          refOrder[currentIndex + 1].current?.focus();
        } else if (currentIndex === refOrder.length - 1) {
          if (validateCustomerDetails()) {
            setCurrentStep(prev => prev + 1);
          }
        }
      }
    };

    const inputClasses = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all duration-300 outline-none text-slate-700 font-medium placeholder:text-slate-400 shadow-sm";
    const labelClasses = "block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest ml-1";

    return (
      <div className="overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar-premium">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label className={labelClasses}>First Name *</label>
                  <input
                    ref={refs.firstName}
                    name="firstName"
                    type="text"
                    value={customerDetails.firstName || ""}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "firstName")}
                    className={inputClasses}
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Email Address *</label>
                  <input
                    ref={refs.email}
                    name="email"
                    type="email"
                    value={customerDetails.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "email")}
                    className={inputClasses}
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label className={labelClasses}>School Name *</label>
                  <input
                    ref={refs.Skolenavn}
                    name="Skolenavn"
                    type="text"
                    value={customerDetails.Skolenavn || ""}
                    onChange={(e) => handleInputChange("Skolenavn", e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "Skolenavn")}
                    className={inputClasses}
                    placeholder="e.g. Copenhagen High"
                  />
                  <div className="mt-4 flex items-center group cursor-pointer" onClick={() => handleInputChange("deliverToSchool", !customerDetails.deliverToSchool)}>
                    <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${customerDetails.deliverToSchool ? 'bg-green-600' : 'bg-slate-200'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 transform ${customerDetails.deliverToSchool ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <label className="ml-3 text-sm font-bold text-slate-600 cursor-pointer">
                      Deliver to school campus
                    </label>
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>City *</label>
                  <input
                    ref={refs.city}
                    name="city"
                    type="text"
                    value={customerDetails.city || ""}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "city")}
                    className={inputClasses}
                    placeholder="e.g. Copenhagen"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label className={labelClasses}>Last Name *</label>
                  <input
                    ref={refs.lastName}
                    name="lastName"
                    type="text"
                    value={customerDetails.lastName || ""}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "lastName")}
                    className={inputClasses}
                    placeholder="Enter your last name"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Phone Number *</label>
                  <input
                    ref={refs.phone}
                    name="phone"
                    type="tel"
                    value={customerDetails.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "phone")}
                    className={inputClasses}
                    placeholder="+45 00 00 00 00"
                  />
                </div>

                <div>
                  <label className={labelClasses}>Street Address *</label>
                  <input
                    ref={refs.address}
                    name="address"
                    type="text"
                    value={customerDetails.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "address")}
                    className={inputClasses}
                    placeholder="Enter street and number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Postal Code *</label>
                    <input
                      ref={refs.postalCode}
                      name="postalCode"
                      type="text"
                      value={customerDetails.postalCode || ""}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, "postalCode")}
                      className={inputClasses}
                      placeholder="0000"
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Country</label>
                    <select
                      ref={refs.country}
                      name="country"
                      value={customerDetails.country || "Denmark"}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, "country")}
                      className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%20stroke%3D%22currentColor%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat`}
                    >
                      <option value="Denmark">Denmark</option>
                      <option value="Sweden">Sweden</option>
                      <option value="Norway">Norway</option>
                      <option value="Germany">Germany</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className={labelClasses}>Delivery Preference</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <button
                  onClick={() => handleInputChange("deliveryType", "regular")}
                  className={`flex items-start p-4 rounded-2xl border-2 transition-all duration-300 text-left ${customerDetails.deliveryType === "regular" ? 'border-green-600 bg-green-50/50 shadow-md' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 mr-3 transition-colors ${customerDetails.deliveryType === "regular" ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                    {customerDetails.deliveryType === "regular" && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Regular Delivery</p>
                    <p className="text-xs text-slate-500 font-medium">Estimated 6 weeks free shipping</p>
                  </div>
                </button>
                <button
                  onClick={() => handleInputChange("deliveryType", "express")}
                  className={`flex items-start p-4 rounded-2xl border-2 transition-all duration-300 text-left ${customerDetails.deliveryType === "express" ? 'border-green-600 bg-green-50/50 shadow-md' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 mr-3 transition-colors ${customerDetails.deliveryType === "express" ? 'border-green-600 bg-green-600' : 'border-slate-300 bg-white'}`}>
                    {customerDetails.deliveryType === "express" && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Express Priority</p>
                    <p className="text-xs text-slate-500 font-medium">Estimated 3 weeks delivery</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-4">
              <label className={labelClasses}>Order Notes (Optional)</label>
              <textarea
                ref={refs.notes}
                name="notes"
                value={customerDetails.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, "notes")}
                rows={3}
                className={`${inputClasses} resize-none min-h-[100px]`}
                placeholder="Any special requests or comments for your order..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  };



  // Step 3: Order Confirmation
  const renderOrderConfirmation = () => (
    <div className="overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar-premium">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Customer Details Summary */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors duration-500"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Delivery Details</h3>
                <p className="text-sm text-slate-500 font-medium">Verify your information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer Name</span>
                  <span className="text-sm font-bold text-slate-700">{customerDetails.firstName} {customerDetails.lastName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email Contact</span>
                  <span className="text-sm font-bold text-slate-700">{customerDetails.email}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</span>
                  <span className="text-sm font-bold text-slate-700">{customerDetails.phone}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Shipping Address</span>
                  <span className="text-sm font-bold text-slate-700 leading-relaxed">
                    {customerDetails.address}<br />
                    {customerDetails.postalCode} {customerDetails.city}<br />
                    {customerDetails.country}
                  </span>
                </div>
                {customerDetails.Skolenavn && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Educational Institution</span>
                    <span className="text-sm font-bold text-slate-700">{customerDetails.Skolenavn}</span>
                  </div>
                )}
              </div>
            </div>

            {customerDetails.notes && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Special Instructions</span>
                <p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl italic">"{customerDetails.notes}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Product Configuration Summary */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-green-50 transition-colors duration-500"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Configuration Summary</h3>
                <p className="text-sm text-slate-500 font-medium">Garments in your order</p>
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(selectedOptions).filter(([category, options]) => isGarmentConfigured(category, options) && selectedGarments[category]).map(([category, options]) => {
                const filteredOptions = filterOptions(options);
                if (Object.keys(filteredOptions).length === 0) return null;

                return (
                  <div key={category} className="bg-slate-50/50 rounded-[1.5rem] p-6 border border-slate-100 hover:bg-white hover:border-green-100 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-extrabold text-slate-800 text-sm capitalize flex items-center">
                        <div className="w-1.5 h-4 bg-green-500 rounded-full mr-2"></div>
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <span className="text-lg font-bold text-green-600">
                        {GARMENT_PRICES[category]} DKK
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                      {Object.entries(filteredOptions).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-xs font-bold text-slate-700">{formatValue(value, category, key)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors duration-500"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Order Total</h3>
                <p className="text-sm text-slate-500 font-medium">Final pricing breakdown</p>
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-[1.5rem] p-6 border border-slate-100 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">Subtotal</span>
                <span className="text-lg font-bold text-slate-800">{subtotal} DKK</span>
              </div>
              {vatPct > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600">VAT ({vatPct}%)</span>
                  <span className="text-lg font-bold text-slate-800">{vatAmount} DKK</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-800">Total</span>
                  <span className="text-2xl font-black text-green-600">{totalWithVat} DKK</span>
                </div>
              </div>
              {amountPaid > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-green-600">Amount Already Paid</span>
                    <span className="text-lg font-bold text-green-600">-{amountPaid} DKK</span>
                  </div>
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-slate-800">Balance Due</span>
                      <span className="text-2xl font-black text-blue-600">{computedBalanceDue} DKK</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  const renderThankYouPage = () => (
    <div className="overflow-y-auto px-6 py-12 custom-scrollbar-premium">
      <div className="max-w-xl mx-auto text-center space-y-8">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-green-700 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-green-200 animate-in bounce-in duration-1000">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Order Received!</h2>
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            Your premium clothing configuration has been successfully queued for production.
          </p>
        </div>

        <div className="bg-slate-50 rounded-[2rem] p-8 border border-white shadow-inner">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Confirmation Number</span>
          <p className="text-2xl font-black text-slate-800 tracking-tight font-mono">{orderDate}</p>
          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-center space-x-2">
            <Mail className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-slate-500">Receipt sent to {customerDetails.email}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={() => {
              handleResetModal();
              window.location.href = "https://shop.studentlife.dk/homepage-duplicate-95/";
              onClose()
            }}
            className="flex-1 flex items-center justify-center px-8 py-5 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm transform active:scale-95"
          >
            <ShoppingCart className="w-5 h-5 mr-3" />
            Continue Shopping
          </button>

          <button
            onClick={() => {
              handleResetModal();
              if (onContinueConfiguring) {
                onContinueConfiguring();
              }
            }}
            className="flex-1 flex items-center justify-center px-8 py-5 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl font-bold hover:from-black hover:to-slate-800 transition-all duration-300 shadow-xl shadow-slate-200 transform active:scale-95"
          >
            <Settings className="w-5 h-5 mr-3" />
            Change Design
          </button>
        </div>
      </div>
    </div>
  );
  // Get step content
  // Get step content
  const getStepContent = () => {
    if (orderComplete) {
      return renderThankYouPage();
    }

    switch (currentStep) {
      case 0:
        return renderQuoteReview();
      case 1:
        return renderCustomerDetails();
      case 2:
        return renderOrderConfirmation();
      default:
        return renderQuoteReview();
    }
  };

  // Get step icon
  const getStepIcon = (step) => {
    if (orderComplete) return CheckCircle;

    switch (step) {
      case 0:
        return Package;
      case 1:
        return User;
      case 2:
        return CreditCard;
      default:
        return Package;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-white/40 rounded-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
        {/* Modal Header with Step Indicator */}
        <div className="relative bg-gradient-to-r from-green-50 via-white to-green-50 border-b border-green-100">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-700/5"></div>
          <div className="relative p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg">
                  {React.createElement(getStepIcon(currentStep), { className: "w-5 h-5 text-white" })}
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {orderComplete ? 'Order Complete' : steps[currentStep]}
                  </h2>
                  {!orderComplete && (
                    <p className="text-gray-600 text-sm mt-1 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                      Step {currentStep + 1} of {steps.length}
                    </p>
                  )}
                </div>
              </div>
              {!orderComplete && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110 group"
                >
                  <X className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                </button>
              )}
            </div>

            {/* Step Progress Indicator - Only show if not on thank you page */}
            {!orderComplete && (
              <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                {steps.map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200 ${index <= currentStep
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'border-gray-300 text-gray-400'
                      }`}>
                      {index < currentStep ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>
                    <span className={`ml-1 text-xs font-medium ${index <= currentStep ? 'text-green-700' : 'text-gray-400'
                      }`}>
                      {step}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`w-6 h-0.5 mx-2 ${index < currentStep ? 'bg-green-600' : 'bg-gray-300'
                        }`} />
                    )}
                  </div>
                ))}
              </div>
            )}


          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto">
          {getStepContent()}
        </div>

        {/* Enhanced Footer with Step Navigation - Only show if not on thank you page */}
        {!orderComplete && (
          <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-t border-gray-100 p-6">
            {/* Price Section */}
            <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl p-4 mb-4 border border-green-200">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Subtotal</span>
                    <span className="text-sm font-bold text-gray-700">{subtotal} DKK</span>
                  </div>
                  {vatPct > 0 && (
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-500 uppercase">VAT ({vatPct}%)</span>
                      <span className="text-sm font-bold text-gray-700">{vatAmount} DKK</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-1 pt-1 border-t border-gray-200">
                    <span className="text-xs font-bold text-gray-700 uppercase">Total</span>
                    <span className="text-lg font-bold text-gray-900">{totalWithVat} DKK</span>
                  </div>
                  {amountPaid > 0 && (
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-green-600 uppercase">Amount Already Paid</span>
                      <span className="text-sm font-bold text-green-600">-{amountPaid} DKK</span>
                    </div>
                  )}
                  {editDeadline && (
                    <div className="flex items-center text-[10px] text-yellow-700 font-bold bg-yellow-100/50 px-2 py-1 rounded-md mt-2">
                       <History className="w-3 h-3 mr-1" />
                       Edit window expires: {editDeadline.toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="text-right pl-6 border-l border-green-200 ml-6">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    {computedBalanceDue <= 0 ? 'STATUS' : 'BALANCE DUE'}
                  </span>
                  <div className="flex items-baseline justify-end">
                    <span className="text-2xl font-black bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                      {computedBalanceDue <= 0 ? (paymentStatus === 'paid' ? 'PAID' : 'FREE') : computedBalanceDue}
                    </span>
                    {computedBalanceDue > 0 && <span className="text-sm font-bold text-green-600 ml-1">DKK</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-3 flex-1">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </button>
                )}

                {currentStep === 0 && (
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                  >
                    Continue Designing
                  </button>
                )}
              </div>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => {
                    if (currentStep === 0 && Object.values(selectedGarments).every(v => !v)) {
                      message.error('Please select at least one garment to continue.');
                      return;
                    }
                    if (currentStep === 1 && !validateCustomerDetails()) {
                      message.error('Please fill in all required fields.');
                      return;
                    }
                    setCurrentStep(prev => prev + 1);
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 via-green-600 to-green-700 text-white py-2 px-4 rounded-lg font-medium text-sm hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    Continue
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              ) : (
                <button
                  onClick={handleConfirmOrder}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 via-green-600 to-green-700 text-white py-2 px-4 rounded-lg font-medium text-sm hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {computedBalanceDue <= 0 ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Save and finalize design
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-1" />
                            Pay {computedBalanceDue} DKK
                          </>
                        )}
                      </>
                    )}
                  </span>
                  {!isLoading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteModal;