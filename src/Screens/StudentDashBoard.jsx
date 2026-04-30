// StudentDashboard.jsx (full fixed code with iframe src fixed to use null instead of empty string)
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { message, Tag, Dropdown, Drawer, Avatar, Divider, Form, Input, Switch } from 'antd';
import img1 from '../assets/menuimages/1.png';
import img2 from '../assets/menuimages/2.png';
import img3 from '../assets/menuimages/3.png';
import img4 from '../assets/menuimages/4.png';
import img5 from '../assets/menuimages/5.png';
import img6 from '../assets/menuimages/6.png';
// import img10 from '../assets/logo.jpeg';
import Tshirt from '../Components/Tshirt';
import Hoodie from '../Components/Hoodie';
import ZippedHoodie from '../Components/ZippedHoodie';
import Shorts from '../Components/Shorts';
import SweatPants from '../Components/SweatPants';
import SweatShirt from '../Components/SweatShirt';
import QuoteModal from '../Components/Modal';
import HistoryModal from '../Components/HistoryModal';
import InquiryModal from '../Components/InquiryModal';
import { useParams, useSearchParams } from 'react-router-dom';
import { GraduationCap, ChevronUp, ChevronDown, LogOut, Settings, LayoutGrid, Lock, History, Package, User, RefreshCw, RotateCcw } from 'lucide-react';
import StudentPopup from '../Components/Popup';
import useLogoStore from '../store/logoStore';
import useSettingsStore from '../store/settingsStore';
import { useAuth } from '../context/AuthContext';
import { getMyOrder, getMyOrderHistory, placeOrder, unlockOrder, lockOrder, deleteHistory, getStudentProfile, updateStudentProfile, changePasswordAuth, getMyClassBackDesigns, resetOrder, createFreshOrder } from '../api/api';
import useSocket from '../hooks/useSocket';
import useBackDesignStore from '../store/backDesignStore';
const StudentDashboard = ({ customizations, setCustomizations, setShowBackPopup /*, setShowBackTextPopup */ }) => { // COMMENTED: Back text feature disabled
    const { logout } = useAuth();
    const { backDesigns } = useBackDesignStore();
    // 1. Move Constants & Logic to top
    const DEFAULT_SELECTIONS = {
        'T-SHIRT': {
            selectedColor: 'Red',
            selectedSize: '',
            pressureOptions: {
                rightChestText: '', rightChestFlag: '', rightChestLogoPredefined: '', rightChestLogoCustom: '', rightChestType: '',
                leftChestText: '', leftChestFlag: '', leftChestLogoPredefined: '', leftChestLogoCustom: '', leftChestType: '',
                rightSleeveText: '', rightSleeveFlag: '', rightSleeveFlag2: '', rightSleeveFlagCount: 1, rightSleeveLogoPredefined: '', rightSleeveLogoCustom: '', rightSleeveType: '',
                leftSleeveText: '', leftSleeveFlag: '', leftSleeveFlag2: '', leftSleeveFlagCount: 1, leftSleeveLogoPredefined: '', leftSleeveLogoCustom: '', leftSleeveType: '',
                backDesign: null,
            }
        },
        'SWEATSHIRT': {
            selectedColor: 'Red',
            selectedSize: '',
            pressureOptions: {
                rightChestText: '', rightChestFlag: '', rightChestLogoPredefined: '', rightChestLogoCustom: '', rightChestType: '',
                leftChestText: '', leftChestFlag: '', leftChestLogoPredefined: '', leftChestLogoCustom: '', leftChestType: '',
                rightSleeveText: '', rightSleeveFlag: '', rightSleeveFlag2: '', rightSleeveFlagCount: 1, rightSleeveLogoPredefined: '', rightSleeveLogoCustom: '', rightSleeveType: '',
                leftSleeveText: '', leftSleeveFlag: '', leftSleeveFlag2: '', leftSleeveFlagCount: 1, leftSleeveLogoPredefined: '', leftSleeveLogoCustom: '', leftSleeveType: '',
                backDesign: null,
            }
        },
        'HOODIE': {
            selectedColor: 'Red',
            selectedSize: '',
            pressureOptions: {
                rightChestText: '', rightChestFlag: '', rightChestLogoPredefined: '', rightChestLogoCustom: '', rightChestType: '',
                leftChestText: '', leftChestFlag: '', leftChestLogoPredefined: '', leftChestLogoCustom: '', leftChestType: '',
                bottomChestText: '', bottomChestFlag: '', bottomChestLogoPredefined: '', bottomChestLogoCustom: '', bottomChestType: '',
                rightSleeveText: '', rightSleeveFlag: '', rightSleeveFlag2: '', rightSleeveFlagCount: 1, rightSleeveLogoPredefined: '', rightSleeveLogoCustom: '', rightSleeveType: '',
                leftSleeveText: '', leftSleeveFlag: '', leftSleeveFlag2: '', leftSleeveFlagCount: 1, leftSleeveLogoPredefined: '', leftSleeveLogoCustom: '', leftSleeveType: '',
                backDesign: null,
            }
        },
        'ZIPPERHOODIE': {
            selectedColor: 'Red',
            selectedSize: '',
            pressureOptions: {
                rightChestText: '', rightChestFlag: '', rightChestLogoPredefined: '', rightChestLogoCustom: '', rightChestType: '',
                leftChestText: '', leftChestFlag: '', leftChestLogoPredefined: '', leftChestLogoCustom: '', leftChestType: '',
                rightSleeveText: '', rightSleeveFlag: '', rightSleeveFlag2: '', rightSleeveFlagCount: 1, rightSleeveLogoPredefined: '', rightSleeveLogoCustom: '', rightSleeveType: '',
                leftSleeveText: '', leftSleeveFlag: '', leftSleeveFlag2: '', leftSleeveFlagCount: 1, leftSleeveLogoPredefined: '', leftSleeveLogoCustom: '', leftSleeveType: '',
                backDesign: null,
            }
        },
        'SWEATPANTS': {
            selectedColor: 'Red',
            selectedSize: '',
            pressureOptions: {
                rightLegText: '', rightLegFlag: '', rightLegLogoPredefined: '', rightLegLogoCustom: '', rightLegType: '',
                leftLegText: '', leftLegFlag: '', leftLegLogoPredefined: '', leftLegLogoCustom: '', leftLegType: '',
            }
        },
        'SHORTS': {
            selectedColor: 'Red',
            selectedSize: '',
            pressureOptions: {
                rightLegText: '', rightLegFlag: '', rightLegLogoPredefined: '', rightLegLogoCustom: '', rightLegType: '',
                leftLegText: '', leftLegFlag: '', leftLegLogoPredefined: '', leftLegLogoCustom: '', leftLegType: '',
            }
        }
    };

    const { fetchSettings, getGarmentPrice, getVat } = useSettingsStore();

    // Fetch settings on mount
    useEffect(() => { fetchSettings(); }, []);

    const GARMENT_PRICES = {
        'T-SHIRT': getGarmentPrice('T-SHIRT') || 1200,
        'SWEATSHIRT': getGarmentPrice('SWEATSHIRT') || 1500,
        'HOODIE': getGarmentPrice('HOODIE') || 2000,
        'ZIPPERHOODIE': getGarmentPrice('ZIPPERHOODIE') || 2200,
        'SWEATPANTS': getGarmentPrice('SWEATPANTS') || 2000,
        'SHORTS': getGarmentPrice('SHORTS') || 1500,
    };

    const isGarmentConfigured = (garmentType, garmentData) => {
        const defaults = DEFAULT_SELECTIONS[garmentType];
        if (!defaults) return true;

        // Color aur Size sync hote hain globally — inhe "configured" nahi maante
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

    // 2. State
    const [allSelections, setAllSelections] = useState(DEFAULT_SELECTIONS);
    const [activeMenu, setActiveMenu] = useState('T-SHIRT');
    const [backDesignKey, setBackDesignKey] = useState(0); // force Test remount on page switch
    const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [profileTab, setProfileTab] = useState('info'); // 'info' | 'edit' | 'password'
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileEditForm] = Form.useForm();
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
    const [undoAvailable, setUndoAvailable] = useState(false);
    const [searchParams] = useSearchParams();
    const packageName = searchParams.get("package");
    const program = searchParams.get("program");
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [globalEmblem, setGlobalEmblem] = useState({ name: 'Guld', value: 'Guld', color: '#FCD34D' });
    const [isAppReady, setIsAppReady] = useState(false);
    const [isIframeLoaded, setIsIframeLoaded] = useState(false);
    const [extraCoverReset, setExtraCoverReset] = useState(false)

    // Garment switch copy popup state
    const [copyDesignPrompt, setCopyDesignPrompt] = useState(null); // { from, to }
    // Track which garments user has explicitly added to order
    const [orderedGarments, setOrderedGarments] = useState({});
    const [sizeFlag, setSizeFlag] = useState(true)
    const [errors, setErrors] = useState({});
    const [isLocked, setIsLocked] = useState(false);
    const [deadline, setDeadline] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [dbHistory, setDbHistory] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState("");
    const [existingDeliveryDetails, setExistingDeliveryDetails] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [amountPaid, setAmountPaid] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState('unpaid');
    const [editDeadline, setEditDeadline] = useState(null);
    const [classStatus, setClassStatus] = useState(null); // tracking.class_status
    const [backDesignStatus, setBackDesignStatus] = useState(null); // back design approval status
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    // 3. Derived State
    const calculateTotalPrice = () => {
        let total = 0;
        Object.entries(allSelections).forEach(([type, options]) => {
            if (isGarmentConfigured(type, options)) {
                total += GARMENT_PRICES[type] || 0;
            }
        });
        return total;
    };

    const subtotal = calculateTotalPrice();
    const vatPct = getVat(); // e.g. 10
    const vatAmount = Math.round(subtotal * vatPct / 100);
    const dynamicPrice = subtotal + vatAmount;
    const balanceDue = Math.max(0, dynamicPrice - amountPaid);


    const { logos, loading, fetchLogos } = useLogoStore();
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const school_id = user?.school_id;
    useEffect(() => {
        if (school_id) {
            fetchLogos({ page: 1, limit: 100, school_id });
        }
    }, [school_id, fetchLogos]);

    // --- Real-time Socket Updates ---
    const userId = user?.id;

    const fetchOrderData = async () => {
        try {
            const resOrder = await getMyOrder();
            if (resOrder.data?.success && resOrder.data.data) {
                const order = resOrder.data.data;
                setOrderId(order.id);
                setIsLocked(order.is_locked);
                setAmountPaid(parseFloat(order.amount_paid || 0));
                setPaymentStatus(order.payment_status || 'unpaid');
                if (order.edit_deadline) setEditDeadline(new Date(order.edit_deadline));
                if (order.class?.change_deadline) setDeadline(new Date(order.class.change_deadline));
                if (order.tracking?.class_status) setClassStatus(order.tracking.class_status);
                if (order.delivery_details) {
                    const details = typeof order.delivery_details === 'string'
                        ? JSON.parse(order.delivery_details) : order.delivery_details;
                    setExistingDeliveryDetails(details);
                }
                if (order.order_items?.length > 0) {
                    const newSelections = JSON.parse(JSON.stringify(DEFAULT_SELECTIONS));
                    order.order_items.forEach(item => {
                        const type = item.product_type;
                        if (newSelections[type]) {
                            newSelections[type].selectedColor = item.selectedColor;
                            newSelections[type].selectedSize = item.selectedSize;
                            newSelections[type].pressureOptions = item.design_config;
                        }
                    });
                    setAllSelections(newSelections);
                    const sName = user?.name || "Student";
                    setCustomizations(prev => ({ ...prev, [sName]: newSelections }));
                    setSelectedStudent(sName);
                }
            }
        } catch (err) {
            console.error("Error re-fetching order:", err);
        }
    };

    const fetchBackDesignStatus = async () => {
        try {
            const resBackDesigns = await getMyClassBackDesigns();
            if (resBackDesigns.data?.success && resBackDesigns.data.data) {
                const backDesignsData = resBackDesigns.data.data;
                // API returns a single object or an array
                const latestDesign = Array.isArray(backDesignsData)
                    ? (backDesignsData.find(d => d.class_id === user?.class_id) || backDesignsData[0])
                    : backDesignsData;
                if (latestDesign) {
                    setBackDesignStatus(latestDesign.approval_status);
                }
            }
        } catch (err) {
            console.error("Error fetching back design status:", err);
        }
    };

    const handleRefreshStatus = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                fetchOrderData(),
                fetchHistoryData(),
                fetchBackDesignStatus()
            ]);
            message.success("Status updated!");
        } catch (err) {
            console.error("Error refreshing status:", err);
            message.error("Failed to refresh status");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleResetOrder = async () => {
        console.log("🔄 Reset button clicked, orderId:", orderId);

        if (!orderId) {
            message.error("No active order found to reset.");
            return;
        }

        setIsResetting(true);
        try {
            console.log("🔄 Calling resetOrder API with orderId:", orderId);
            const response = await resetOrder(orderId);
            console.log("🔄 Reset response:", response);

            if (response.data?.success) {
                message.success("Order reset successfully! Starting fresh design.");

                // Reset local state to defaults
                setAllSelections(DEFAULT_SELECTIONS);
                setCustomizations(prev => ({
                    ...prev,
                    [selectedStudent]: DEFAULT_SELECTIONS
                }));

                // Refresh data
                await fetchOrderData();
                await fetchHistoryData();

                setShowResetModal(false);
            }
        } catch (err) {
            console.error("Error resetting order:", err);
            message.error(err.response?.data?.message || "Failed to reset order.");
        } finally {
            setIsResetting(false);
        }
    };

    const handleCreateFreshOrder = async () => {
        setIsResetting(true);
        try {
            const response = await createFreshOrder();
            if (response.data?.success) {
                message.success("Fresh order created! Start designing from scratch.");

                // Reset local state to defaults
                setAllSelections(DEFAULT_SELECTIONS);
                setCustomizations(prev => ({
                    ...prev,
                    [selectedStudent]: DEFAULT_SELECTIONS
                }));

                // Refresh data
                await fetchOrderData();
                await fetchHistoryData();

                setShowResetModal(false);
            }
        } catch (err) {
            console.error("Error creating fresh order:", err);
            message.error(err.response?.data?.message || "Failed to create fresh order.");
        } finally {
            setIsResetting(false);
        }
    };

    const fetchHistoryData = async () => {
        try {
            const resHistory = await getMyOrderHistory();
            if (resHistory.data?.success && resHistory.data.data) {
                setDbHistory(resHistory.data.data);
            }
        } catch (err) {
            console.error("Error re-fetching history:", err);
        }
    };

    // Subscribe to real-time events
    useSocket(
        userId ? `order_update_${userId}` : null,
        `order_update_${userId}`,
        (data) => {
            console.log('🔔 Real-time order update received:', data);
            fetchOrderData();
            fetchHistoryData();
            fetchBackDesignStatus(); // Also refresh back design status
        }
    );

    useSocket(
        userId ? `history_update_${userId}` : null,
        `history_update_${userId}`,
        (data) => {
            console.log('🔔 Real-time history update received:', data);
            fetchHistoryData();
        }
    );

    // Listen for back design approval updates
    useSocket(
        user?.class_id ? `back_design_update_${user.class_id}` : null,
        `back_design_update_${user.class_id}`,
        (data) => {
            console.log('🔔 Real-time back design update received:', data);
            fetchBackDesignStatus();
            if (data.approval_status === 'approved') {
                message.success('🎉 Your back design has been approved!');
            } else if (data.approval_status === 'rejected') {
                message.error('❌ Your back design has been rejected. Please contact your class representative.');
            }
        }
    );

    // --- Fetch Existing Order & History ---
    useEffect(() => {
        if (user && user.role === 'student') {
            fetchOrderData();
            fetchHistoryData();
            fetchBackDesignStatus();
        }
    }, []);

    useEffect(() => {
        if (user) {
            setIsAdmin(user.role === 'admin' || user.role === 'class_representative');

            const now = new Date();

            // 1. Check Class Deadline
            if (user.class_deadline) {
                const deadlineDate = new Date(user.class_deadline);
                setDeadline(deadlineDate);
                if (now > deadlineDate && user.role === 'student') {
                    setIsLocked(true);
                }
            }

            // 2. Check Post-Payment Edit Deadline (if exists)
            if (editDeadline && now > editDeadline && user.role === 'student' && paymentStatus === 'paid') {
                setIsLocked(true);
            }
        }
    }, [user, editDeadline, paymentStatus]);

    const handleLogout = () => {
        logout();
        window.location.reload();
    };

    const handleChangeMode = () => {
        setMode(null);
        localStorage.removeItem('mode');
    };

    // Jab selected student change ho → uske customizations load karo
    useEffect(() => {
        if (!selectedStudent) return;

        const studentData = customizations[selectedStudent] || DEFAULT_SELECTIONS;
        setAllSelections(studentData);
    }, [selectedStudent, customizations]);

    const handleUpdateSelection = (category, updates) => {
        console.log("HANDLE UPDATE:", category, updates);

        if (isLocked && !isAdmin) {
            message.warning("Editing is locked after the deadline.");
            return;
        }

        // 1. Update LOCAL state immediately for responsive UI
        setAllSelections(prev => {
            console.log("PREV STATE:", prev[category]);
            const next = JSON.parse(JSON.stringify(prev));

            // Color — sirf active garment pe apply hoga (sync band)
            if (updates.selectedColor) {
                next[category].selectedColor = updates.selectedColor;
            }

            // Size — sirf active garment pe apply hoga (sync band)
            if (updates.selectedSize) {
                next[category].selectedSize = updates.selectedSize;
            }

            // Sync Pressure Options with positional mapping
            if (updates.pressureOptions) {
                const pUpdates = updates.pressureOptions;

                // For SHORTS, apply updates directly without cross-category sync
                if (category === 'SHORTS') {
                    Object.keys(pUpdates).forEach(key => {
                        if (next[category].pressureOptions) {
                            next[category].pressureOptions[key] = pUpdates[key];
                        }
                    });
                } else {
                    // Original complex mapping logic for other categories
                    Object.keys(pUpdates).forEach(key => {
                        if (key === 'backDesign') {
                            const val = pUpdates[key];
                            ['T-SHIRT', 'SWEATSHIRT', 'HOODIE', 'ZIPPERHOODIE'].forEach(cat => {
                                if (next[cat]) next[cat].pressureOptions.backDesign = val;
                            });
                            return;
                        }

                        const newValue = pUpdates[key];
                        // Regex for exact position matching to avoid chest/sleeve cross-contamination
                        const match = key.match(/^(rightChest|leftChest|rightSleeve|leftSleeve|bottomChest|rightLeg|leftLeg)(.*)$/);
                        if (match) {
                            const basePos = match[1];
                            const suffix = match[2]; // e.g., "Text", "Flag", "Type"

                            // Map Chest to Leg for unified "side" selection
                            const mapping = {
                                'rightChest': ['rightChest', 'rightLeg'],
                                'leftChest': ['leftChest', 'leftLeg'],
                                'rightLeg': ['rightChest', 'rightLeg'],
                                'leftLeg': ['leftChest', 'leftLeg'],
                                'rightSleeve': ['rightSleeve'],
                                'leftSleeve': ['leftSleeve'],
                                'bottomChest': ['bottomChest']
                            };

                            const targets = mapping[basePos] || [basePos];
                            Object.keys(next).forEach(cat => {
                                targets.forEach(tPos => {
                                    const tKey = `${tPos}${suffix}`;
                                    if (next[cat].pressureOptions && next[cat].pressureOptions.hasOwnProperty(tKey)) {
                                        next[cat].pressureOptions[tKey] = newValue;
                                    }
                                });
                            });
                        }
                    });
                }
            }

            // Apply any non-sync updates directly
            Object.keys(updates).forEach(key => {
                if (key !== 'selectedColor' && key !== 'selectedSize' && key !== 'pressureOptions') {
                    next[category][key] = updates[key];
                }
            });

            // 2. Schedule parent state update
            setCustomizations(prevCustom => {
                const updated = { ...prevCustom, [selectedStudent]: next };

                // (BackDesign batch sync removed as multi-student mode is disabled)

                // Save to history for Change Control
                setHistory(h => {
                    const newH = [...h.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(updated))].slice(-10);
                    setHistoryIndex(newH.length - 1);
                    setUndoAvailable(newH.length > 1);
                    return newH;
                });

                return updated;
            });

            console.log("NEXT STATE:", next[category]);
            return next;
        });
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            const prevState = history[prevIndex];
            setCustomizations(prevState);
            setAllSelections(prevState[selectedStudent] || DEFAULT_SELECTIONS);
            setHistoryIndex(prevIndex);
            setUndoAvailable(prevIndex > 0);
            message.info("Changes reverted.");
        }
    };

    const handleRevertToVersion = (versionItem) => {
        if (!versionItem.changes) return;

        try {
            // changes usually contains previousItems or similar structure
            // In our paymentController we save { previousItems: existingOrder.order_items }
            // Let's assume versionItem.order_items (from the history list API)
            const items = versionItem.order_items || versionItem.changes.previousItems;

            if (items && Array.isArray(items)) {
                const newSelections = JSON.parse(JSON.stringify(DEFAULT_SELECTIONS));
                items.forEach(item => {
                    const type = item.product_type;
                    if (newSelections[type]) {
                        newSelections[type].selectedColor = item.selectedColor;
                        newSelections[type].selectedSize = item.selectedSize;
                        newSelections[type].pressureOptions = item.design_config;
                    }
                });

                // Update state
                setAllSelections(newSelections);
                setCustomizations(prev => ({
                    ...prev,
                    [selectedStudent]: newSelections
                }));

                // Push to local UNDO history so user can revert this restoration
                setHistory(h => {
                    const updated = { ...customizations, [selectedStudent]: newSelections };
                    const newH = [...h.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(updated))].slice(-10);
                    setHistoryIndex(newH.length - 1);
                    setUndoAvailable(true);
                    return newH;
                });

                message.success(`Restored Version ${versionItem.version}`);
                setIsHistoryModalOpen(false);
            }
        } catch (err) {
            console.error("Error reverting version:", err);
            message.error("Failed to restore this version.");
        }
    };

    // Save Design — garment selection modal
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveGarmentSelection, setSaveGarmentSelection] = useState({});

    const handleSaveClick = () => {
        if (isLocked && !isAdmin) {
            message.warning("Order is locked and cannot be saved.");
            return;
        }
        // Build list of configured garments for user to pick from
        const configured = {};
        Object.entries(allSelections).forEach(([type, options]) => {
            if (isGarmentConfigured(type, options)) {
                configured[type] = true; // pre-select all configured
            }
        });
        if (Object.keys(configured).length === 0) {
            message.warning("Pehle koi garment configure karein.");
            return;
        }
        setSaveGarmentSelection(configured);
        setShowSaveModal(true);
    };

    const handleSaveOrder = async (selectedTypes) => {
        setIsSaving(true);
        setShowSaveModal(false);
        try {
            const garments = selectedTypes.map(type => ({
                product_type: type,
                selectedColor: allSelections[type].selectedColor,
                selectedSize: allSelections[type].selectedSize,
                design_config: allSelections[type].pressureOptions || {}
            }));

            const response = await placeOrder({
                student_id: user?.id,
                class_id: user?.class_id,
                garments,
                delivery_details: existingDeliveryDetails || {},
                logo_id: null
            });

            if (response.data?.success) {
                message.success("Design saved successfully!");
                const resHistory = await getMyOrderHistory();
                if (resHistory.data?.success) setDbHistory(resHistory.data.data);
            }
        } catch (err) {
            console.error("Error saving order:", err);
            message.error(err.response?.data?.message || "Failed to save design.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAdminUnlock = async () => {
        if (!orderId) {
            message.error("No order found to unlock.");
            return;
        }
        try {
            const res = await unlockOrder(orderId);
            if (res.data?.success) {
                setIsLocked(false);
                message.success("Order unlocked for student.");
            }
        } catch (err) {
            console.error("Error unlocking order:", err);
            message.error("Failed to unlock order.");
        }
    };
    const menuItems = [
        { name: 'T-SHIRT', icon: img1 },
        { name: 'SWEATSHIRT', icon: img2 },
        { name: 'HOODIE', icon: img3 },
        { name: 'ZIPPERHOODIE', icon: img4 },
        { name: 'SWEATPANTS', icon: img5 },
        { name: 'SHORTS', icon: img6 },
    ];
    // Generic handler for all option changes
    // Function to collect all selected options
    // Force iframe src initialization
    useEffect(() => {
        const playcanvasUrl = 'https://playcanv.as/e/p/1b1eadeb/';
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe && !iframe.src) iframe.src = playcanvasUrl;
        });
    }, []);

    // Unified message sending logic for Page switching and state synchronization
    useEffect(() => {
        if (!isAppReady) return;

        const menuIndex = menuItems.findIndex(item => item.name === activeMenu);
        if (menuIndex !== -1) {
            ['preview-iframe', 'preview-iframe2'].forEach((id) => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    const pageNum = menuIndex + 1;
                    console.log(`Sending Page : ${pageNum} for ${activeMenu}`);

                    // 1. Switch Page
                    iframe.contentWindow.postMessage(`Page : ${pageNum}`, "*");
                    iframe.contentWindow.postMessage('Tilvælg:no', "*");

                    // 2. Initial state sync for the new model
                    setTimeout(() => {
                        const currentData = allSelections[activeMenu];
                        if (currentData) {
                            const { selectedColor, selectedSize } = currentData;

                            const prefixMap = {
                                'T-SHIRT': 'T-Shirt: ',
                                'SWEATSHIRT': 'SweatShirt: ',
                                'HOODIE': 'Hoodie: ',
                                'ZIPPERHOODIE': 'ZipperHoodie: ',
                                'SWEATPANTS': 'SweatPant: ',
                                'SHORTS': 'Short: '
                            };

                            const prefix = prefixMap[activeMenu];
                            if (prefix) {
                                if (selectedColor) iframe.contentWindow.postMessage(`${prefix}${selectedColor.toLowerCase()}`, "*");
                                if (selectedSize) iframe.contentWindow.postMessage(`${prefix}size:${selectedSize}`, "*");
                            }
                        }
                        // Force Test component to remount and re-send back design
                        setBackDesignKey(k => k + 1);
                    }, 300);
                }
            });
        }
    }, [activeMenu, isAppReady]);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'app:ready') {
                console.log("App Ready signal received in Dashboard");
                setIsAppReady(true);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Jab selected student change ho → uske customizations load karo
    useEffect(() => {
        if (!selectedStudent) return;

        // Ensure customizations has an entry for this student
        if (!customizations[selectedStudent]) {
            setCustomizations(prev => ({
                ...prev,
                [selectedStudent]: DEFAULT_SELECTIONS
            }));
            setAllSelections(DEFAULT_SELECTIONS);
        } else {
            setAllSelections(customizations[selectedStudent]);
        }
    }, [selectedStudent, customizations]);
    console.log("logosasasad", logos);
    console.log("🔄 Debug - showResetModal:", showResetModal, "orderId:", orderId, "isResetting:", isResetting);
    return (
        <>
            {/* ── Copy Design Prompt Modal ── */}
            {copyDesignPrompt && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">
                            Copy Design?
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">
                            You configured <span className="font-bold text-green-700">{copyDesignPrompt.from}</span>.
                            Copy this design to <span className="font-bold text-green-700">{copyDesignPrompt.to}</span> as well?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    // Copy pressureOptions from source to target
                                    const sourceData = allSelections[copyDesignPrompt.from];
                                    setAllSelections(prev => ({
                                        ...prev,
                                        [copyDesignPrompt.to]: {
                                            ...prev[copyDesignPrompt.to],
                                            pressureOptions: { ...sourceData.pressureOptions }
                                        }
                                    }));
                                    setActiveMenu(copyDesignPrompt.to);
                                    setCopyDesignPrompt(null);
                                }}
                                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all"
                            >
                                Haan, Copy Karo
                            </button>
                            <button
                                onClick={() => {
                                    setActiveMenu(copyDesignPrompt.to);
                                    setCopyDesignPrompt(null);
                                }}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                            >
                                Nahi, Alag Rakho
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Save Design — Garment Selection Modal ── */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Select Garments to Save</h3>
                        <p className="text-sm text-slate-500 mb-5">Select items to include in your order</p>
                        <div className="space-y-3 mb-6">
                            {Object.entries(saveGarmentSelection).map(([type, checked]) => (
                                <label key={type} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-green-300 cursor-pointer transition-all">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => setSaveGarmentSelection(prev => ({ ...prev, [type]: !prev[type] }))}
                                        className="w-4 h-4 accent-green-600"
                                    />
                                    <span className="text-sm font-semibold text-slate-700">{type}</span>
                                    <span className="ml-auto text-xs font-bold text-green-600">{GARMENT_PRICES[type]} DKK</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    const selected = Object.entries(saveGarmentSelection)
                                        .filter(([, v]) => v).map(([k]) => k);
                                    if (selected.length === 0) {
                                        message.warning("Kam az kam ek garment select karein.");
                                        return;
                                    }
                                    handleSaveOrder(selected);
                                }}
                                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all"
                            >
                                Save Karein
                            </button>
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reset Order Modal ── */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Reset Order</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            This will clear all your current designs and start fresh. This action cannot be undone.
                        </p>
                        <div className="space-y-3 mb-6">
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                                <p className="text-sm text-orange-700 font-medium">⚠️ Warning</p>
                                <p className="text-xs text-orange-600 mt-1">All current garment configurations will be lost</p>
                            </div>
                            <div className="text-xs text-slate-500">
                                Debug: orderId = {orderId}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    console.log("🔄 Reset Order button clicked in modal");
                                    handleResetOrder();
                                }}
                                disabled={isResetting}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                                {isResetting ? 'Resetting...' : 'Reset Order'}
                            </button>
                            <button
                                onClick={() => {
                                    console.log("🔄 Cancel button clicked in modal");
                                    setShowResetModal(false);
                                }}
                                disabled={isResetting}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                {/* Global Header */}
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">StudentLife</h1>
                            <div className="flex items-center space-x-2">
                                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest leading-none">Cloth Configurator</p>
                                {isLocked && (
                                    <Tag color="error" className="flex items-center space-x-1 px-1.5 py-0 rounded border-red-100 h-4">
                                        <Lock className="w-2.5 h-2.5" />
                                        <span className="text-[9px] font-bold uppercase">Locked</span>
                                    </Tag>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {/* Refresh Status Button */}
                        {/* <button
                            onClick={handleRefreshStatus}
                            disabled={isRefreshing}
                            className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-medium text-sm border border-blue-200 disabled:opacity-50"
                            title="Refresh approval status"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                        </button> */}

                        {/* Reset Order Button */}
                        {/* {orderId && (
                            <button
                                onClick={() => {
                                    console.log("🔄 Reset button clicked, orderId:", orderId, "isLocked:", isLocked, "isAdmin:", isAdmin);
                                    setShowResetModal(true);
                                }}
                                disabled={isResetting || (isLocked && !isAdmin)}
                                className="flex items-center space-x-2 px-3 py-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-all font-medium text-sm border border-orange-200 disabled:opacity-50"
                                title="Reset order and start fresh"
                            >
                                <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Reset</span>
                            </button>
                        )} */}

                        {/* {undoAvailable && (
                            <button
                                onClick={handleUndo}
                                className="flex items-center space-x-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-medium text-sm border border-slate-200"
                                title="Undo last change"
                            >
                                <span className="rotate-180">↺</span>
                                <span className="hidden sm:inline">Undo</span>
                            </button>
                        )} */}
                        {/* <button
                            onClick={handleSaveClick}
                            disabled={isSaving || (isLocked && !isAdmin)}
                            className={`flex items-center space-x-2 px-3 py-2 ${isSaving ? 'bg-slate-100' : 'bg-green-600 hover:bg-green-700'} text-white rounded-xl transition-all font-medium text-sm shadow-sm disabled:opacity-50`}
                        >
                            <Settings className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Design'}</span>
                        </button> */}
                        {/* {dbHistory.length > 0 && (
                            <button
                                onClick={() => setIsHistoryModalOpen(true)}
                                className="flex items-center space-x-2 px-3 py-2 bg-white text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm border border-slate-200"
                                title="View Saved Versions"
                            >
                                <History className="w-4 h-4 text-green-600" />
                                <span className="hidden sm:inline">History</span>
                            </button>
                        )} */}
                        {/* <button
                            onClick={() => setShowBackPopup(true)}
                            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all font-medium text-sm shadow-md"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="hidden sm:inline">Design Back</span>
                            <span className="sm:hidden text-[10px]">Back</span>
                        </button>
                        {/* COMMENTED: Back text feature disabled */}
                        {/* <button
                            onClick={() => setShowBackTextPopup(true)}
                            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-indigo-700 text-white rounded-xl hover:bg-indigo-800 transition-all font-medium text-sm shadow-md"
                        >
                            <Type className="w-4 h-4" />
                            <span className="hidden sm:inline">Back Text</span>
                            <span className="sm:hidden text-[10px]">Text</span>
                        </button> */}

                        <Dropdown
                            menu={{
                                items: [
                                    // {
                                    //     key: 'profile',
                                    //     label: 'Profile',
                                    //     icon: <User />,
                                    //     onClick: () => setProfileDrawerOpen(true),
                                    // },
                                    // { type: 'divider' },
                                    {
                                        key: 'logout',
                                        label: 'Log out',
                                        icon: <LogOut className="w-3.5 h-3.5" />,
                                        danger: true,
                                        onClick: handleLogout,
                                    },
                                ],
                            }}
                            trigger={['click']}
                            placement="bottomRight"
                        >
                        <button className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-slate-100 transition-all">
                            <Avatar
                                size={34}
                                style={{ backgroundColor: '#16a34a', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
                            >
                                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                            </Avatar>
                            <span className="hidden sm:inline text-sm font-semibold text-slate-700 max-w-[100px] truncate">
                                {user?.name || 'Student'}
                            </span>
                        </button>
                        </Dropdown>
                    </div>
                </header>

                {/* Status Bar for Locked / Deadline / Progress */}
                {/* <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs font-semibold text-slate-600">
                                {Object.entries(allSelections).filter(([type, options]) => isGarmentConfigured(type, options)).length} configured
                            </span>
                        </div>

                        <div className="w-px h-4 bg-slate-200" />

                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 font-medium">Total</span>
                            <span className="text-xs font-bold text-slate-700">{dynamicPrice} DKK</span>
                        </div>

                        {amountPaid > 0 && (
                            <>
                                <div className="w-px h-4 bg-slate-200" />
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-400 font-medium">Paid</span>
                                    <span className="text-xs font-bold text-green-600">{amountPaid} DKK</span>
                                </div>
                            </>
                        )}

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                            paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-slate-100 text-slate-500'
                            }`}>
                            {paymentStatus}
                        </span>
                        {classStatus && (() => {
                            const statusMap = {
                                active: { label: 'Order in progress', color: 'bg-blue-100 text-blue-700' },
                                orders_locked: { label: 'Order locked – going to production', color: 'bg-orange-100 text-orange-700' },
                                production_ready: { label: 'Being produced', color: 'bg-purple-100 text-purple-700' },
                                shipped: { label: 'Shipped – check email for tracking', color: 'bg-indigo-100 text-indigo-700' },
                                completed: { label: 'Delivered', color: 'bg-green-100 text-green-700' },
                            };
                            const s = statusMap[classStatus];
                            if (!s) return null;
                            return (
                                <>
                                    <div className="w-px h-4 bg-slate-200" />
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider ${s.color}`}>
                                        {s.label}
                                    </span>
                                </>
                            );
                        })()}

                        {backDesignStatus && (() => {
                            const statusMap = {
                                pending: { label: 'Back Design: Pending Review', color: 'bg-yellow-100 text-yellow-700' },
                                approved: { label: 'Back Design: Approved ✓', color: 'bg-green-100 text-green-700' },
                                rejected: { label: 'Back Design: Rejected', color: 'bg-red-100 text-red-700' },
                            };
                            const s = statusMap[backDesignStatus];
                            if (!s) return null;
                            return (
                                <>
                                    <div className="w-px h-4 bg-slate-200" />
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider ${s.color}`}>
                                        {s.label}
                                    </span>
                                </>
                            );
                        })()}

                        {editDeadline && (
                            <>
                                <div className="w-px h-4 bg-slate-200" />
                                <div className="flex items-center gap-1.5">
                                    <History className="w-3.5 h-3.5 text-yellow-500" />
                                    <span className={`text-xs font-semibold ${new Date() > editDeadline ? 'text-red-500' : 'text-slate-500'}`}>
                                        Edit: {editDeadline.toLocaleDateString()} {new Date() > editDeadline && '· Expired'}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                  
                        {isLocked && (
                            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                                <Lock className="w-3 h-3 text-red-500" />
                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                                    {editDeadline && new Date() > editDeadline ? 'Window Expired' : deadline && new Date() > deadline ? 'Deadline Passed' : 'Locked'}
                                </span>
                            </div>
                        )}

                        {isAdmin && isLocked && (
                            <button
                                onClick={handleAdminUnlock}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                            >
                                Unlock
                            </button>
                        )}
                    </div>
                </div> */}

                <div className="hidden md:flex h-[calc(100vh-80px)] w-full relative">
                    {/* Sidebar */}
                    <div className="flex flex-col h-full border-r border-slate-200 bg-white shadow-xl z-10 w-[600px] min-w-[500px]">
                        <div className='flex flex-1 min-h-0'>
                            <div className="bg-white/70 border-r border-slate-200 overflow-y-auto firstdiv custom-scrollbar-premium min-w-[100px]">
                                <div className="p-6">
                                    <h2 className="text-sm font-semibold text-center text-slate-600 uppercase tracking-wider mb-4">
                                        Clothing
                                    </h2>
                                    <nav className="">
                                        {menuItems.map((item, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    // Agar current garment configured hai aur naya garment configured nahi
                                                    // toh copy karne ka poochho
                                                    const currentConfigured = isGarmentConfigured(activeMenu, allSelections[activeMenu]);
                                                    const targetConfigured = isGarmentConfigured(item.name, allSelections[item.name]);
                                                    if (
                                                        item.name !== activeMenu &&
                                                        currentConfigured &&
                                                        !targetConfigured
                                                    ) {
                                                        setCopyDesignPrompt({ from: activeMenu, to: item.name });
                                                    } else {
                                                        setActiveMenu(item.name);
                                                    }
                                                }}
                                                className={`flex items-center px-2 py-3 rounded-xl transition-all duration-200 group w-full ${activeMenu === item.name
                                                    ? 'bg-gradient-to-r from-green-50 to-green-50 border border-green-200 shadow-sm'
                                                    : 'hover:bg-slate-50 hover:shadow-sm'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-transform duration-200 ${activeMenu === item.name ? 'scale-110' : 'group-hover:scale-105'
                                                    }`}>
                                                    <img src={item.icon} alt={item.name} className="w-10 h-10 object-contain" />
                                                </div>
                                                {/* <span className={`text-sm font-medium ${activeMenu === item.name ? 'text-slate-900' : 'text-slate-600'}`}>{item.name}</span> */}
                                                {activeMenu === item.name && (
                                                    <div className="ml-auto w-2 h-2 bg-green-700 rounded-full"></div>
                                                )}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>
                            <div className="flex-1 bg-white/50 secondDiv overflow-y-auto custom-scrollbar-premium" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <div className="px-6 pt-6 space-y-8">

                                    {activeMenu === 'T-SHIRT' && <Tshirt key={`tshirt-${backDesignKey}`} isAppReady={isAppReady} logos={logos} data={allSelections['T-SHIRT']} onUpdate={(updates) => handleUpdateSelection('T-SHIRT', updates)} backDesigns={backDesigns} onOpenInquiry={() => setIsInquiryModalOpen(true)} />}
                                    {activeMenu === "SWEATSHIRT" && <SweatShirt key={`sweatshirt-${backDesignKey}`} isAppReady={isAppReady} logos={logos} data={allSelections['SWEATSHIRT']} onUpdate={(updates) => handleUpdateSelection('SWEATSHIRT', updates)} onOpenInquiry={() => setIsInquiryModalOpen(true)} />}
                                    {activeMenu === "HOODIE" && <Hoodie key={`hoodie-${backDesignKey}`} isAppReady={isAppReady} logos={logos} data={allSelections['HOODIE']} onUpdate={(updates) => handleUpdateSelection('HOODIE', updates)} onOpenInquiry={() => setIsInquiryModalOpen(true)} />}
                                    {activeMenu === "ZIPPERHOODIE" && <ZippedHoodie key={`zipper-${backDesignKey}`} isAppReady={isAppReady} logos={logos} data={allSelections['ZIPPERHOODIE']} onUpdate={(updates) => handleUpdateSelection('ZIPPERHOODIE', updates)} onOpenInquiry={() => setIsInquiryModalOpen(true)} />}
                                    {activeMenu === "SWEATPANTS" && <SweatPants key={`sweatpants-${backDesignKey}`} isAppReady={isAppReady} logos={logos} data={allSelections['SWEATPANTS']} onUpdate={(updates) => handleUpdateSelection('SWEATPANTS', updates)} onOpenInquiry={() => setIsInquiryModalOpen(true)} />}
                                    {activeMenu === "SHORTS" && <Shorts key={`shorts-${backDesignKey}`} isAppReady={isAppReady} logos={logos} data={allSelections['SHORTS']} onUpdate={(updates) => handleUpdateSelection('SHORTS', updates)} onOpenInquiry={() => setIsInquiryModalOpen(true)} />}
                                </div>
                            </div>
                        </div>
                        <div className=" border-slate-200 p-6 bg-white/50 backdrop-blur-sm">
                            {/* <div className="mb-4 space-y-1.5">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Subtotal</span>
                                    <span>{subtotal} DKK</span>
                                </div>
                                {vatPct > 0 && (
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>VAT ({vatPct}%)</span>
                                        <span>{vatAmount} DKK</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                                    <span className="text-sm font-semibold text-slate-700">Total</span>
                                    <span className="text-2xl font-bold text-slate-900">{dynamicPrice} DKK</span>
                                </div>
                            </div> */}
                            <button
                                onClick={() => setIsInquiryModalOpen(true)}
                                disabled={!sizeFlag}
                                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 shadow-md
           
        ${sizeFlag
                                        ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-lg"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                            >
                                {balanceDue <= 0 && paymentStatus === 'paid' ? 'Save Changes' : (balanceDue > 0 && amountPaid > 0 ? `Pay Balance (${balanceDue} DKK)` : 'Send Inquiry')}
                            </button>
                        </div>
                    </div>
                    {/* Main Content Area */}
                    <div className="flex flex-1 h-full">
                        {/* Preview Panel */}
                        <div className="flex-1 p-6">
                            <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl h-full flex flex-col border border-slate-200">
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-600 rounded-xl flex items-center justify-center">
                                            <GraduationCap className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800">Selected {activeMenu}</h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-medium text-slate-600">LIVE PREVIEW</span>
                                    </div>
                                </div>
                                {/* Iframe Preview */}
                                <div className="flex-1 rounded-b-2xl overflow-hidden">
                                    <iframe
                                        id="preview-iframe"
                                        src={'https://playcanv.as/e/p/1b1eadeb/'}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        title="3D Student Card Preview"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="md:hidden flex flex-col ">
                    {/* Mobile Preview Panel - Top */}
                    <div className="flex flex-col h-screen">
                        {/* Main content area that will scroll */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Preview section */}
                            <div
                                // className={`transition-all duration-300 ${isConfigOpen ? 'h-[35vh]' : 'h-[70vh]'
                                className={`transition-all duration-300 ${isConfigOpen ? 'h-[35vh]' : 'h-[35vh]'
                                    }`}
                            >
                                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 h-full">
                                    <div className="flex items-center justify-between p-4 border-b border-slate-200">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-600 rounded-xl flex items-center justify-center">
                                                <GraduationCap className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 text-sm">Selected {activeMenu}</h4>
                                                {/* <p className="text-xs text-slate-600 capitalize" >{program.toUpperCase()}</p> */}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {isLocked && (
                                                <Tag color="error" className="flex items-center space-x-1 px-2 py-0.5 rounded-full border-red-100">
                                                    <Lock className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold uppercase tracking-tight">Locked</span>
                                                </Tag>
                                            )}
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-xs font-medium text-slate-600">LIVE</span>
                                        </div>
                                    </div>
                                    {/* Scrolling Message */}
                                    {/* <div className="bg-yellow-100 border-y border-yellow-300 px-4 py-2">
                  <p className="text-[10px] text-yellow-800 font-semibold text-center">
                    Ændringen vises ikke på huen, men bare rolig — det er ikke en fejl 😉 Din hue bliver præcis, som du designer den.
                    Er du i tvivl? Skriv til os på Instagram eller TikTok, så uploader vi en video af en hue, der ligner din 🎥✨
                  </p>
                </div> */}
                                    <div
                                        className="h-[calc(100%-60px)] rounded-b-2xl overflow-hidden"
                                        style={{
                                            pointerEvents: isConfigOpen ? 'none' : 'auto',
                                        }}
                                    >
                                        <iframe
                                            id="preview-iframe2"
                                            src={'https://playcanv.as/e/p/1b1eadeb/'}
                                            className="w-full h-full"
                                            frameBorder="0"
                                            title="3D Student Card Preview"
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Config Toggle Button */}
                            <div className="px-4 py-2 bg-white/80 border-t border-slate-200 flex justify-center flex-shrink-0">
                                <button
                                    onClick={() => setIsConfigOpen(!isConfigOpen)}
                                    className="flex items-center justify-center w-full py-2 bg-slate-100 rounded-lg text-slate-700 font-medium"
                                >
                                    {isConfigOpen ? (
                                        <>
                                            <ChevronDown className="w-4 h-4 mr-1" />
                                            Hide Configuration
                                        </>
                                    ) : (
                                        <>
                                            <ChevronUp className="w-4 h-4 mr-1" />
                                            Show Configuration
                                        </>
                                    )}
                                </button>
                            </div>
                            {/* Config Panel (collapsible + scrollable) */}
                            {/* Config Panel (collapsible + scrollable) */}
                            <div
                                // className={`transition-all duration-300 overflow-y-auto ${isConfigOpen ? '' : 'flex-none h-0'
                                // }`}
                                className={`transition-all duration-300 overflow-y-auto max-h-[30vh] md:max-h-full ${isConfigOpen ? 'max-h-[30vh]' : 'max-h-0'
                                    }`}
                            >
                                {isConfigOpen && (
                                    <div className="p-4 space-y-6">
                                        {/* Keep all components mounted but conditionally show based on activeMenu */}
                                        {activeMenu === 'T-SHIRT' && <Tshirt isAppReady={isAppReady} data={allSelections['T-SHIRT']} onUpdate={(updates) => handleUpdateSelection('T-SHIRT', updates)} />}
                                        {activeMenu === "SWEATSHIRT" && <SweatShirt isAppReady={isAppReady} data={allSelections['SWEATSHIRT']} onUpdate={(updates) => handleUpdateSelection('SWEATSHIRT', updates)} />}
                                        {activeMenu === "HOODIE" && <Hoodie isAppReady={isAppReady} data={allSelections['HOODIE']} onUpdate={(updates) => handleUpdateSelection('HOODIE', updates)} />}
                                        {activeMenu === "ZIPPERHOODIE" && <ZippedHoodie isAppReady={isAppReady} data={allSelections['ZIPPERHOODIE']} onUpdate={(updates) => handleUpdateSelection('ZIPPERHOODIE', updates)} />}
                                        {activeMenu === "SWEATPANTS" && <SweatPants isAppReady={isAppReady} data={allSelections['SWEATPANTS']} onUpdate={(updates) => handleUpdateSelection('SWEATPANTS', updates)} />}
                                        {activeMenu === "SHORTS" && <Shorts isAppReady={isAppReady} data={allSelections['SHORTS']} onUpdate={(updates) => handleUpdateSelection('SHORTS', updates)} />}
                                    </div>
                                )}
                            </div>
                            {/* Sidebar - Now inside the scrollable area but above footer */}
                            <div className="bg-white/70 border-t border-slate-200 flex-shrink-0">
                                <div className="px-4 pt-2">
                                    <h3 className="text-xs font-semibold text-center text-slate-600 uppercase tracking-wider mb-3">
                                        Clothing
                                    </h3>
                                    <div className="flex overflow-x-auto space-x-3 pb-2">
                                        {menuItems.map((item, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setActiveMenu(item.name)
                                                }}
                                                className={`flex-shrink-0 flex flex-col items-center px-3 rounded-xl transition-all duration-200 min-w-[80px] ${activeMenu === item.name
                                                    ? 'bg-gradient-to-r from-green-50 to-green-50 border border-green-200 shadow-sm'
                                                    : 'hover:bg-slate-50 hover:shadow-sm'
                                                    }`}
                                            >
                                                <div
                                                    className={`w-8 rounded-lg flex items-center justify-center mb-2 transition-transform duration-200 ${activeMenu === item.name ? 'scale-110' : 'hover:scale-105'
                                                        }`}
                                                >
                                                    <img
                                                        src={item.icon}
                                                        alt={item.name}
                                                        className="w-6 h-6 object-contain"
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-slate-600 text-center leading-tight">
                                                    {item.name.replace(' ', '\n')}
                                                </span>
                                                {activeMenu === item.name && (
                                                    <div className="mt-1 w-2 h-2 bg-green-500 rounded-full"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Fixed Footer - Always visible at bottom */}
                        <div className="border-t border-slate-200 p-4 bg-white/90 backdrop-blur-sm flex-shrink-0">
                            <div className="mb-3 space-y-1">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Subtotal</span>
                                    <span>{subtotal} DKK</span>
                                </div>
                                {vatPct > 0 && (
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>VAT ({vatPct}%)</span>
                                        <span>{vatAmount} DKK</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                                    <span className="text-sm font-semibold text-slate-700">Total</span>
                                    <span className="text-xl font-bold text-slate-900">{dynamicPrice} DKK</span>
                                </div>
                            </div>
                            <div className="flex space-x-3 mb-4">
                                <button
                                    onClick={handleSaveOrder}
                                    disabled={isSaving || (isLocked && !isAdmin)}
                                    className="flex-1 flex items-center justify-center space-x-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold transition-all hover:bg-slate-200 disabled:opacity-50"
                                >
                                    <Settings className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                                    <span>{isSaving ? 'Saving...' : 'Save Design'}</span>
                                </button>
                                {dbHistory.length > 0 && (
                                    <button
                                        onClick={() => setIsHistoryModalOpen(true)}
                                        className="flex-1 flex items-center justify-center space-x-2 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold transition-all hover:bg-slate-50"
                                    >
                                        <History className="w-4 h-4 text-green-600" />
                                        <span>History</span>
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setIsInquiryModalOpen(true)}
                                // disabled={!sizeFlag}
                                // disabled={!sizeFlag}
                                className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 shadow-md
        ${sizeFlag
                                        ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-lg"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                            >
                                Send Inquiry
                            </button>
                        </div>
                    </div>
                    {/* Quote Modal */}
                </div>
                <QuoteModal
                    isOpen={isQuoteModalOpen}
                    onClose={() => setIsQuoteModalOpen(false)}
                    selectedOptions={allSelections}
                    defaultSelections={DEFAULT_SELECTIONS}
                    price={dynamicPrice}
                    amountPaid={amountPaid}
                    paymentStatus={paymentStatus}
                    balanceDue={balanceDue}
                    editDeadline={editDeadline}
                    packageName={packageName}
                    program={program}
                    initialDeliveryDetails={existingDeliveryDetails}
                />
                <InquiryModal
                    isOpen={isInquiryModalOpen}
                    onClose={() => setIsInquiryModalOpen(false)}
                />
                <HistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    history={dbHistory}
                    onRevert={handleRevertToVersion}
                    onHistoryUpdated={fetchHistoryData}
                />

                {/* ── Profile Drawer ── */}
                <Drawer
                    title={null}
                    placement="right"
                    width={360}
                    open={profileDrawerOpen}
                    onClose={() => { setProfileDrawerOpen(false); setProfileTab('info'); }}
                    styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
                    afterOpenChange={(open) => {
                        if (open) {
                            getStudentProfile().then(r => {
                                if (r.data?.success) {
                                    const d = r.data.data;
                                    setProfileData(d);
                                    profileEditForm.setFieldsValue({
                                        name: d.name,
                                        phone_number: d.phone_number || '',
                                        year_of_birth: d.year_of_birth || '',
                                        consent_production: d.consent_production,
                                        consent_marketing: d.consent_marketing,
                                    });
                                }
                            }).catch(() => { });
                        }
                    }}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-green-600 to-green-700 px-6 py-8 text-center flex-shrink-0">
                        <Avatar size={72} style={{ backgroundColor: '#fff', color: '#16a34a', fontSize: 28, fontWeight: 700 }}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                        </Avatar>
                        <h2 className="text-white font-bold text-lg mt-3">{profileData?.name || user?.name}</h2>
                        <p className="text-green-100 text-sm">{profileData?.email || user?.email}</p>
                        {profileData?.class?.name && (
                            <span className="inline-block mt-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                {profileData.class.name}
                            </span>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 flex-shrink-0">
                        {[['info', 'Info'], ['edit', 'Edit'], ['password', 'Password']].map(([key, label]) => (
                            <button key={key} onClick={() => setProfileTab(key)}
                                className={`flex-1 py-2.5 text-xs font-bold transition-all ${profileTab === key ? 'border-b-2 border-green-600 text-green-700' : 'text-slate-500 hover:text-slate-700'}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">

                        {/* INFO TAB */}
                        {profileTab === 'info' && (
                            <div className="space-y-4">
                                {[
                                    ['Email', profileData?.email],
                                    ['Phone', profileData?.phone_number || '—'],
                                    ['Year of Birth', profileData?.year_of_birth || '—'],
                                    ['School', profileData?.school?.name || '—'],
                                    ['Class', profileData?.class?.name || '—'],
                                    ['Order Status', paymentStatus?.toUpperCase()],
                                    ['Amount Paid', amountPaid > 0 ? `${amountPaid} DKK` : '—'],
                                ].map(([label, val]) => (
                                    <div key={label}>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                                        <p className="text-sm font-semibold text-slate-700">{val}</p>
                                    </div>
                                ))}
                                {/* <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Consent</p>
                                    <p className="text-xs text-slate-600">Production: {profileData?.consent_production ? '✅' : '❌'}</p>
                                    <p className="text-xs text-slate-600">Marketing: {profileData?.consent_marketing ? '✅' : '❌'}</p>
                                </div> */}
                            </div>
                        )}

                        {/* EDIT TAB */}
                        {profileTab === 'edit' && (
                            <Form form={profileEditForm} layout="vertical" size="middle"
                                onFinish={async (vals) => {
                                    setProfileSaving(true);
                                    try {
                                        const r = await updateStudentProfile(vals);
                                        if (r.data?.success) {
                                            message.success('Profile updated!');
                                            setProfileData(r.data.data);
                                        }
                                    } catch { message.error('Update failed'); }
                                    finally { setProfileSaving(false); }
                                }}
                            >
                                <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Phone" name="phone_number">
                                    <Input placeholder="+45 00 00 00 00" />
                                </Form.Item>
                                <Form.Item label="Year of Birth" name="year_of_birth">
                                    <select
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-green-500"
                                        onChange={(e) => profileEditForm.setFieldValue('year_of_birth', e.target.value)}
                                        value={profileEditForm.getFieldValue('year_of_birth') || ''}
                                    >
                                        <option value="">Select year</option>
                                        {Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </Form.Item>
                                {/* <Form.Item label="Production Consent" name="consent_production" valuePropName="checked">
                                    <Switch />
                                </Form.Item>
                                <Form.Item label="Marketing Consent" name="consent_marketing" valuePropName="checked">
                                    <Switch />
                                </Form.Item> */}
                                <Form.Item>
                                    <button type="submit" disabled={profileSaving}
                                        className="w-full py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-all disabled:opacity-50">
                                        {profileSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </Form.Item>
                            </Form>
                        )}

                        {/* PASSWORD TAB */}
                        {profileTab === 'password' && (
                            <Form layout="vertical" size="middle"
                                onFinish={async (vals) => {
                                    if (vals.newPassword !== vals.confirmPassword) {
                                        message.error('Passwords do not match'); return;
                                    }
                                    setProfileSaving(true);
                                    try {
                                        await changePasswordAuth({ currentPassword: vals.currentPassword, newPassword: vals.newPassword });
                                        message.success('Password changed!');
                                    } catch (e) { message.error(e.response?.data?.message || 'Failed'); }
                                    finally { setProfileSaving(false); }
                                }}
                            >
                                <Form.Item label="Current Password" name="currentPassword" rules={[{ required: true }]}>
                                    <Input.Password />
                                </Form.Item>
                                <Form.Item label="New Password" name="newPassword" rules={[{ required: true, min: 6 }]}>
                                    <Input.Password />
                                </Form.Item>
                                <Form.Item label="Confirm Password" name="confirmPassword" rules={[{ required: true }]}>
                                    <Input.Password />
                                </Form.Item>
                                <Form.Item>
                                    <button type="submit" disabled={profileSaving}
                                        className="w-full py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-all disabled:opacity-50">
                                        {profileSaving ? 'Updating...' : 'Change Password'}
                                    </button>
                                </Form.Item>
                            </Form>
                        )}
                    </div>

                    <Divider style={{ margin: 0 }} />
                    <div className="px-6 py-4 flex-shrink-0">
                        <button onClick={() => { setProfileDrawerOpen(false); handleLogout(); }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-100 transition-all border border-red-100">
                            <LogOut className="w-4 h-4" />
                            Log out
                        </button>
                    </div>
                </Drawer>
            </div>
        </>
    );
};
export default StudentDashboard;