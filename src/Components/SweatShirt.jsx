import React, { useState, useEffect } from "react";
import cog from "../assets/menuimages/cogwheel-pen.png";
import plus from "../assets/menuimages/shirt-plus.png";
import Test from "./Test";
import logo1 from "../assets/Universitylogo/logo1.png";
import logo2 from "../assets/Universitylogo/logo2.png";
import logo3 from "../assets/Universitylogo/logo3.jpg";
import logo4 from "../assets/Universitylogo/logo4.png";
import { BASE_URL } from "../utils/const";
import { ALL_FLAGS, getFlagUrl } from "../utils/flags";
import { X, Search, Image as ImageIcon, Flag, Trash2 } from "lucide-react";


const SweatShirt = ({ data, onUpdate, isAppReady, logos }) => {
  const [activeTab, setActiveTab] = useState("size");
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [currentField, setCurrentField] = useState("");

  // Defaults
  const selectedColor = data?.selectedColor || "Red";
  const selectedSize = data?.selectedSize || "";

  const pressureOptions = data?.pressureOptions || {
    rightChestText: "",
    rightChestFlag: "",
    rightChestLogoPredefined: "",
    rightChestLogoCustom: "",
    rightChestType: "", // 'flag' | 'logo' | ''

    leftChestText: "",
    leftChestFlag: "",
    leftChestLogoPredefined: "",
    leftChestLogoCustom: "",
    leftChestType: "",

    rightSleeveText: "",
    rightSleeveFlag: "",
    rightSleeveLogoPredefined: "",
    rightSleeveLogoCustom: "",
    rightSleeveType: "",

    leftSleeveText: "",
    leftSleeveFlag: "",
    leftSleeveLogoPredefined: "",
    leftSleeveLogoCustom: "",
    leftSleeveType: "",

    backDesign: null,
  };

  // Use centralized flags list
  const countries = ALL_FLAGS;
  const flagImages = Object.fromEntries(ALL_FLAGS.map(f => [f.name, f.flagHD || f.flag]));

  // const predefinedLogos = [
  //   { name: "Logo 1", url: logo1 },
  //   { name: "Logo 2", url: logo2 },
  //   { name: "Logo 3", url: logo3 },
  //   { name: "Logo 4", url: logo4 },
  // ];

  // CANVAS CONSTANTS
  // const CANVAS_WIDTH = 300;
  // const TEXT_HEIGHT = 80;
  // const FLAG_HEIGHT = 210;

  const CANVAS_WIDTH = 320;
  const TEXT_HEIGHT = 120;
  const FLAG_HEIGHT = 240;
  const CANVAS_HEIGHT = TEXT_HEIGHT + FLAG_HEIGHT;

  const getEmissiveBase64 = (text, hasFlag = false, hasLogo = false, hasSecondAsset = false) => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");

    // Use transparency instead of black background for cleaner blending
    if (text?.trim()) {
      let fontSize = 48;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      while (ctx.measureText(text).width > CANVAS_WIDTH - 80 && fontSize > 28) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px Arial`;
      }
      ctx.fillText(text, CANVAS_WIDTH / 2, TEXT_HEIGHT / 2);
    }

    if (hasFlag || hasLogo) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, TEXT_HEIGHT, CANVAS_WIDTH, FLAG_HEIGHT);
    }

    // Add black border (mask) if flag or logo is present
    if (hasFlag || hasLogo) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 40;
      ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    }
    if (hasSecondAsset) {
      // 🔲 BLACK BASE
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 40;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      const gap = 10;

      const paddingX = 50;
      const paddingTop = 20;     // 👈 ADD THIS
      const paddingBottom = 20;  // 👈 ADD THIS

      const availableHeight = CANVAS_HEIGHT - paddingTop - paddingBottom - gap;
      const boxHeight = availableHeight / 2;

      const boxWidth = CANVAS_WIDTH - paddingX * 2;
      const x = paddingX;// 👈 adjust this (increase = more cut from sides)

      // const boxWidth = CANVAS_WIDTH - paddingX * 2;
      // const boxHeight = (CANVAS_HEIGHT - gap) / 2;

      // const x = paddingX; // 👈 shift boxes from left

      // TOP BOX
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, paddingTop, boxWidth, boxHeight);

      // BOTTOM BOX
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, paddingTop + boxHeight + gap, boxWidth, boxHeight);
    }
    return canvas.toDataURL("image/png");
  };


  // const getDiffuseBase64 = (flag, logoPre, logoCustom, text, callback, flag2 = "", flagCount = 1) => {
  //   const canvas = document.createElement("canvas");
  //   canvas.width = CANVAS_WIDTH;
  //   canvas.height = CANVAS_HEIGHT;
  //   const ctx = canvas.getContext("2d");

  //   if (text?.trim()) {
  //     let fontSize = 48;
  //     ctx.font = `bold ${fontSize}px Arial`;
  //     ctx.fillStyle = "#ffffff";
  //     ctx.textAlign = "center";
  //     ctx.textBaseline = "middle";

  //     while (ctx.measureText(text).width > CANVAS_WIDTH - 80 && fontSize > 28) {
  //       fontSize -= 2;
  //       ctx.font = `bold ${fontSize}px Arial`;
  //     }
  //     ctx.fillText(text, CANVAS_WIDTH / 2, TEXT_HEIGHT / 2);
  //   }

  //   const drawBorder = () => {
  //     if (flag || logoPre || logoCustom) {
  //       ctx.strokeStyle = "#ffffff";
  //       ctx.lineWidth = 40;
  //       ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  //     }
  //   };

  //   const finalize = () => {
  //     drawBorder();
  //     callback(canvas.toDataURL("image/png"));
  //   };

  //   if (flag && flagImages[flag]) {
  //     const flagW = flagCount === 2 ? CANVAS_WIDTH / 2 : CANVAS_WIDTH;
  //     const img1 = new Image();
  //     img1.crossOrigin = "anonymous";
  //     img1.onload = () => {
  //       ctx.drawImage(img1, 0, TEXT_HEIGHT, flagW, FLAG_HEIGHT);
  //       if (flagCount === 2 && flag2 && flagImages[flag2]) {
  //         const img2 = new Image();
  //         img2.crossOrigin = "anonymous";
  //         img2.onload = () => {
  //           ctx.drawImage(img2, flagW, TEXT_HEIGHT, flagW, FLAG_HEIGHT);
  //           finalize();
  //         };
  //         img2.onerror = finalize;
  //         img2.src = flagImages[flag2];
  //       } else {
  //         finalize();
  //       }
  //     };
  //     img1.onerror = finalize;
  //     img1.src = flagImages[flag];
  //     return;
  //   }

  //   let logoSrc = logoCustom;
  //   if (!logoSrc && logoPre) {
  //     const foundLogo = logos.find((l) => l.name === logoPre);
  //     if (foundLogo?.file_path) {
  //       const cleanPath = foundLogo.file_path.replace(/\\/g, "/");
  //       logoSrc = `${BASE_URL}${cleanPath}`;
  //     }
  //   }

  //   if (logoSrc) {
  //     const img = new Image();
  //     img.crossOrigin = "anonymous";
  //     img.onload = () => {
  //       const ratio = Math.min(
  //         CANVAS_WIDTH / img.width,
  //         FLAG_HEIGHT / img.height
  //       );
  //       const w = img.width * ratio * 0.9;
  //       const h = img.height * ratio * 0.9;
  //       const x = (CANVAS_WIDTH - w) / 2;
  //       const y = TEXT_HEIGHT + (FLAG_HEIGHT - h) / 2;
  //       ctx.drawImage(img, x, y, w, h);
  //       finalize();
  //     };
  //     img.onerror = finalize;
  //     img.src = logoSrc;
  //     return;
  //   }

  //   finalize();
  // };
  const getDiffuseBase64 = (
    flag,
    logoPre,
    logoCustom,
    text,
    callback,
    flag2 = "",
    flagCount = 1
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");

    if (!flag && !flag2 && !logoPre && !logoCustom) {
      // ONLY TEXT MODE
      if (text?.trim()) {
        let fontSize = 48;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        while (ctx.measureText(text).width > CANVAS_WIDTH - 80 && fontSize > 28) {
          fontSize -= 2;
          ctx.font = `bold ${fontSize}px Arial`;
        }

        ctx.fillText(text, CANVAS_WIDTH / 2, TEXT_HEIGHT / 2);
      }

      callback(canvas.toDataURL("image/png"));
      return;
    }

    const hasTwoFlags =
      flag && flagImages[flag] && flag2 && flagImages[flag2];

    // ---------- TEXT ----------
    if (text?.trim() && !hasTwoFlags) {
      let fontSize = 48;

      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      while (
        ctx.measureText(text).width > CANVAS_WIDTH - 80 &&
        fontSize > 28
      ) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px Arial`;
      }

      const y = TEXT_HEIGHT / 2;
      ctx.fillText(text, CANVAS_WIDTH / 2, y);
    }

    const finalize = () => {
      callback(canvas.toDataURL("image/png"));
    };

    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject();
        img.src = src;
      });

    // ---------- 2 FLAGS (FULL CANVAS FIX + NO CUTTING) ----------
    if (hasTwoFlags) {
      Promise.all([
        loadImage(flagImages[flag]),
        loadImage(flagImages[flag2]),
      ])
        .then(([img1, img2]) => {
          const gap = 10;

          const boxWidth = CANVAS_WIDTH * 0.9;
          const boxHeight = (CANVAS_HEIGHT - gap) / 2;

          const x = (CANVAS_WIDTH - boxWidth) / 2;

          // 🔲 WHITE BOX 1 (TOP)
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x, 0, boxWidth, boxHeight);

          // 🔲 WHITE BOX 2 (BOTTOM)
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x, boxHeight + gap, boxWidth, boxHeight);

          // 🖼 FLAG 1
          ctx.drawImage(img1, x, 0, boxWidth, boxHeight);

          // 🖼 FLAG 2
          ctx.drawImage(img2, x, boxHeight + gap, boxWidth, boxHeight);

          finalize();
        })
        .catch(finalize);

      return;
    }

    // ---------- SINGLE FLAG ----------
    if (flag && flagImages[flag]) {
      loadImage(flagImages[flag])
        .then((img) => {
          ctx.drawImage(
            img,
            0,
            TEXT_HEIGHT,
            CANVAS_WIDTH,
            FLAG_HEIGHT
          );
          finalize();
        })
        .catch(finalize);

      return; // ✅ important
    }

    // ---------- LOGO ONLY ----------
    let logoSrc = logoCustom;

    if (!logoSrc && logoPre) {
      const foundLogo = logos.find((l) => l.name === logoPre);
      if (foundLogo?.file_path) {
        let path = foundLogo.file_path.replace(/\\/g, "/");

        if (path.startsWith("http")) {
          logoSrc = path;
        } else {
          logoSrc = `${BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
        }
      }
    }

    if (logoSrc) {
      loadImage(logoSrc)
        .then((img) => {
          const ratio = Math.min(
            CANVAS_WIDTH / img.width,
            FLAG_HEIGHT / img.height
          );

          const w = img.width * ratio * 0.9;
          const h = img.height * ratio * 0.9;

          const x = (CANVAS_WIDTH - w) / 2;
          const y = TEXT_HEIGHT + (FLAG_HEIGHT - h) / 2;

          ctx.drawImage(img, x, y, w, h);
          finalize();
        })
        .catch(finalize);

      return; // ✅ important
    }


    // ---------- EMPTY ----------
    finalize();
  };

  const handleFlagSelect = (field) => {
    setCurrentField(field);
    setShowFlagModal(true);
  };

  const selectFlag = (countryName) => {
    onUpdate({
      pressureOptions: {
        ...pressureOptions,
        [currentField]: countryName,
      },
    });
    setShowFlagModal(false);
  };

  const selectLogo = (logoName, logoId) => {
    onUpdate({
      pressureOptions: {
        ...pressureOptions,
        [currentField]: logoName,
        selectedLogoId: logoId, // save logo ID for order
      },
    });
    setShowFlagModal(false);
  };

  // Auto-select if only one logo exists and none selected yet
  useEffect(() => {
    if (logos && logos.length === 1) {
      const allLogoFields = [
        'rightChestLogoPredefined', 'leftChestLogoPredefined',
        'rightSleeveLogoPredefined', 'leftSleeveLogoPredefined'
      ];
      const anySelected = allLogoFields.some(f => pressureOptions[f]);
      if (!anySelected) {
        onUpdate({
          pressureOptions: {
            ...pressureOptions,
            rightChestLogoPredefined: logos[0].name,
            selectedLogoId: logos[0].id,
          },
        });
      }
    }
  }, [logos]);

  const clearField = (field) => {
    onUpdate({
      pressureOptions: {
        ...pressureOptions,
        [field]: "",
      },
    });
  };

  const getFlagDisplay = (countryName) => {
    if (!countryName) return "";
    // countryName is stored as name — just return it directly
    return countryName;
  };

  const getLogoDisplay = (logoName) => logoName || "";

  const handleTypeChange = (area, type) => {
    onUpdate({
      pressureOptions: {
        ...pressureOptions,

        [`${area}Type`]: type,

        [`${area}Flag`]: type === "flag" ? pressureOptions[`${area}Flag`] : "",
        [`${area}Flag2`]: "",
        [`${area}FlagCount`]: 1,

        // TEXT
        [`${area}Text`]: type === "" ? pressureOptions[`${area}Text`] : "",

        // LOGO RESET
        [`${area}LogoPredefined`]: type === "logo" ? pressureOptions[`${area}LogoPredefined`] : "",
        [`${area}LogoCustom`]: type === "logo" ? pressureOptions[`${area}LogoCustom`] : "",
      },
    });
  };

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    // const colorMap = {
    //   red: 'SweatShirt:red',
    //   orange: 'SweatShirt:orange',
    //   lime: 'SweatShirt:lime',
    //   kit: 'SweatShirt:kit',
    //   'light blue': 'SweatShirt:light blue',
    //   turquoise: 'SweatShirt:turquoise',
    //   navy: 'SweatShirt:navy',
    //   black: 'SweatShirt:black',
    //   'white (black print)': 'SweatShirt:white',
    // };

    const colorMap = {
      red: "SweatShirt:red",
      black: "SweatShirt:black",
      white: "SweatShirt:white",
      natural: "SweatShirt:natural",
      'heather grey': "SweatShirt:heatherGrey",
      navy: "SweatShirt:navy",
      'light pink': "SweatShirt:lightPink",
      'olive green': "SweatShirt:oliveGreen",
      blue: "SweatShirt:blue",
      purple: "SweatShirt:purple",
    };

    const message = colorMap[selectedColor.toLowerCase()];
    if (!message) return;

    ["preview-iframe", "preview-iframe2"].forEach((id) => {
      const iframe = document.getElementById(id);
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(message, "*");
      }
    });
  }, [selectedColor, isAppReady]);

  // useEffect(() => {
  //   if (!data?.selectedColor) {
  //     onUpdate({ selectedColor: "Red" });
  //   }
  // }, []);

  useEffect(() => {
    if (!selectedSize) return;
    const message = `SweatShirt:size:${selectedSize}`;
    ["preview-iframe", "preview-iframe2"].forEach((id) => {
      const iframe = document.getElementById(id);
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(message, "*");
      }
    });
  }, [selectedSize, isAppReady]);

  // Ref to track previous options to prevent unnecessary updates
  const prevPressureOptionsRef = React.useRef({});

  useEffect(() => {
    const areas = ["rightChest", "leftChest", "rightSleeve", "leftSleeve"];

    areas.forEach((area) => {
      const text = pressureOptions[`${area}Text`]?.trim() || "";
      const flag = pressureOptions[`${area}Flag`] || "";
      const flag2 = pressureOptions[`${area}Flag2`] || "";
      const flagCount = pressureOptions[`${area}FlagCount`] || 1;
      const logoPre = pressureOptions[`${area}LogoPredefined`] || "";
      const logoCustom = pressureOptions[`${area}LogoCustom`] || "";
      const type = pressureOptions[`${area}Type`] || "";

      // Check if anything actually changed for this area
      const prev = prevPressureOptionsRef.current[area] || {};
      const hasChanged =
        prev.text !== text ||
        prev.flag !== flag ||
        prev.flag2 !== flag2 ||
        prev.flagCount !== flagCount ||
        prev.logoPre !== logoPre ||
        prev.logoCustom !== logoCustom ||
        prev.type !== type;

      if (!hasChanged) return;

      // Update the ref for this area
      prevPressureOptionsRef.current[area] = { text, flag, flag2, flagCount, logoPre, logoCustom, type };

      const hasText = text.length > 0;
      const hasFlag = !!flag && type === "flag";
      const hasLogo = !!(logoPre || logoCustom) && type === "logo";
      const hasSecondAsset = !!flag2;
      // Emissive
      const opacity = getEmissiveBase64(text, hasFlag, hasLogo, hasSecondAsset);
      ["preview-iframe", "preview-iframe2"].forEach((id) => {
        const iframe = document.getElementById(id);
        if (iframe?.contentWindow) {
          const msg = `SweatShirt:${area}_opacity: ${opacity}`;
          iframe.contentWindow.postMessage(msg, "*");
          console.log("fahhh", msg);

        }
      });

      // Diffuse — pass flag2 and flagCount
      getDiffuseBase64(flag, logoPre, logoCustom, text, (diffuseBase) => {
        ["preview-iframe", "preview-iframe2"].forEach((id) => {
          const iframe = document.getElementById(id);
          if (iframe?.contentWindow) {
            const msg = `SweatShirt:${area}_diffuse: ${diffuseBase}`;
            iframe.contentWindow.postMessage(msg, "*");
            console.log("fahhhhh", msg);

          }
        });
      }, flag2, flagCount);
    });
  }, [isAppReady, pressureOptions]);

  // const colors = [
  //   { name: "Red", value: "#DC143C", border: "#DC143C" },
  //   { name: "Orange", value: "#FF4500", border: "#FF4500" },
  //   { name: "Lime", value: "#C5D86D", border: "#C5D86D" },
  //   { name: "Kit", value: "#D4B896", border: "#D4B896" },
  //   { name: "Light blue", value: "#A8C5D6", border: "#A8C5D6" },
  //   { name: "Turquoise", value: "#0891B2", border: "#0891B2" },
  //   { name: "Navy", value: "#1F2937", border: "#1F2937" },
  //   { name: "Black", value: "#000000", border: "#000000" },
  //   { name: "White (black print)", value: "#FFFFFF", border: "#D1D5DB" },
  // ];

  const colors = [
    { name: "Red", value: "#E61709", border: "#E61709" },
    { name: "Black", value: "#120F14", border: "#120F14" },
    { name: "White", value: "#FFFFFF", border: "#D1D5DB" },
    { name: "Natural", value: "#FFFAD9", border: "#FFFAD9" },
    { name: "Heather Grey", value: "#D4D9DC", border: "#D4D9DC" },
    { name: "Navy", value: "#051734", border: "#051734" },
    { name: "Light Pink", value: "#F0A5C7", border: "#F0A5C7" },
    { name: "Olive Green", value: "#63673F", border: "#63673F" },
    { name: "Blue", value: "#0000FF", border: "#0000FF" },
    { name: "Purple", value: "#431279", border: "#431279" },
  ];

  const sizes = ["S", "M", "L", "XL", "2XL", "3XL"];

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50">
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("size")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === "size"
            ? "bg-white shadow-sm border-2 border-green-700"
            : "bg-white border-2 border-transparent hover:border-gray-300"
            }`}
        >
          <span className="font-medium text-gray-900">Size and color</span>
          <img className="w-10" src={cog} alt="settings" />
        </button>
        <button
          onClick={() => setActiveTab("pressure")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === "pressure"
            ? "bg-white shadow-sm border-2 border-green-700"
            : "bg-white border-2 border-transparent hover:border-gray-300"
            }`}
        >
          <span className="font-medium text-gray-900">Pressure</span>
          <img className="w-10" src={plus} alt="add" />
        </button>
      </div>

      {activeTab === "size" ? (
        <>
          <h1 className="text-3xl font-bold mb-8 text-gray-900">SweatShirt</h1>

          {/* Color Section */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold mb-4 text-gray-700">Color</h2>
            <div className="grid grid-cols-4 gap-4">
              {colors.map((color) => (
                <div key={color.name} className="flex flex-col items-center">
                  <button
                    onClick={() => onUpdate({ selectedColor: color.name })}
                    className="relative w-12 h-12 rounded-lg transition-all focus:outline-none"
                    style={{
                      backgroundColor: color.value,
                      border:
                        selectedColor === color.name
                          ? `3px solid ${color.border}`
                          : `1px solid ${color.border}`,
                      boxShadow:
                        selectedColor === color.name
                          ? `0 0 0 2px white, 0 0 0 4px ${color.border}`
                          : "none",
                    }}
                  >
                    {selectedColor === color.name && (
                      <div className="absolute inset-0 rounded-lg border-2 border-white pointer-events-none" />
                    )}
                  </button>
                  <span className="text-xs mt-2 text-center text-gray-700">
                    {color.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Size Section */}
          <div>
            <h2 className="text-sm font-semibold mb-4 text-gray-700">Size</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdate({ selectedSize: size })}
                  className={`py-3 px-4 rounded-lg border-2 transition-all font-medium ${selectedSize === size
                    ? "border-gray-900 bg-white text-gray-900"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
            <a href="#" className="text-sm text-green-600 hover:underline">
              Size guide
            </a>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-8 text-gray-900">
            Pressure Options
          </h1>

          {/* Chest Area */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Chest Area
            </h2>

            {["rightChest", "leftChest"].map((area) => (
              <div key={area} className="bg-white rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {area === "rightChest" ? "Right Chest:" : "Left Chest:"}
                </h3>
                <div className="space-y-3">
                  {/* Tabs: Text | Flag | Logo */}
                  <div className="flex rounded-lg overflow-hidden border border-gray-200">
                    {["text", "flag", "logo"].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          // if (tab === "text") {
                          //   onUpdate({ pressureOptions: { ...pressureOptions, [`${area}Type`]: "", [`${area}Flag`]: "", [`${area}LogoPredefined`]: "", [`${area}LogoCustom`]: "" } });
                          // } else {
                          //   handleTypeChange(area, tab);
                          // }
                          handleTypeChange(area, tab === "text" ? "" : tab);
                        }}
                        className={`flex-1 py-2 text-xs font-bold capitalize transition-all ${pressureOptions[`${area}Type`] === tab || (tab === "text" && !pressureOptions[`${area}Type`])
                          ? "bg-green-700 text-white"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                      >
                        {tab === "text" ? "Text" : tab === "flag" ? "Flag" : "Logo"}
                        {(tab === "text" && pressureOptions[`${area}Text`]) ||
                          (tab === "flag" && pressureOptions[`${area}Flag`]) ||
                          (tab === "logo" && pressureOptions[`${area}LogoPredefined`]) ? " ✓" : ""}
                      </button>
                    ))}
                  </div>

                  {/* Text */}
                  {!pressureOptions[`${area}Type`] && (
                    <div className="flex flex-wrap gap-2">
                      <input type="text" value={pressureOptions[`${area}Text`]}
                        onChange={(e) => onUpdate({ pressureOptions: { ...pressureOptions, [`${area}Text`]: e.target.value } })}
                        placeholder="Enter text" maxLength={25}
                        className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                      />
                      {pressureOptions[`${area}Text`] && (
                        <button onClick={() => clearField(`${area}Text`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Flag */}
                  {pressureOptions[`${area}Type`] === "flag" && (
                    <div className="flex flex-wrap gap-2">
                      <input type="text" value={getFlagDisplay(pressureOptions[`${area}Flag`])} readOnly placeholder="Select flag"
                        className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer"
                        onClick={() => handleFlagSelect(`${area}Flag`)}
                      />
                      <button onClick={() => handleFlagSelect(`${area}Flag`)} className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 text-sm font-medium">Select</button>
                      {pressureOptions[`${area}Flag`] && (
                        <button onClick={() => clearField(`${area}Flag`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Logo — predefined only, no upload */}
                  {pressureOptions[`${area}Type`] === "logo" && (
                    <div className="flex flex-wrap gap-2">
                      <input type="text" value={getLogoDisplay(pressureOptions[`${area}LogoPredefined`])} readOnly placeholder="Select logo"
                        className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer"
                        onClick={() => handleFlagSelect(`${area}LogoPredefined`)}
                      />
                      <button onClick={() => handleFlagSelect(`${area}LogoPredefined`)} className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 text-sm font-medium">Select</button>
                      {pressureOptions[`${area}LogoPredefined`] && (
                        <button onClick={() => clearField(`${area}LogoPredefined`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Sleeves */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Sleeves
            </h2>

            {["rightSleeve", "leftSleeve"].map((area) => (
              <div key={area} className="bg-white rounded-lg p-4 mb-4">
                {
                  console.log(
                    area,
                    pressureOptions[`${area}FlagCount`],
                    Number(pressureOptions[`${area}FlagCount`] || 1)
                  )
                }
                <h3 className="font-semibold text-gray-900 mb-3">
                  {area === "rightSleeve" ? "Right Sleeve:" : "Left Sleeve:"}
                </h3>
                <div className="space-y-3">
                  <div className="flex rounded-lg overflow-hidden border border-gray-200">
                    {["text", "flag", "logo"].map((tab) => (
                      <button key={tab} type="button"
                        onClick={() => {
                          if (tab === "text") {
                            onUpdate({ pressureOptions: { ...pressureOptions, [`${area}Type`]: "", [`${area}Flag`]: "", [`${area}LogoPredefined`]: "", [`${area}LogoCustom`]: "" } });
                          } else { handleTypeChange(area, tab); }
                        }}
                        className={`flex-1 py-2 text-xs font-bold capitalize transition-all ${pressureOptions[`${area}Type`] === tab || (tab === "text" && !pressureOptions[`${area}Type`])
                          ? "bg-green-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                      >
                        {tab === "text" ? "Text" : tab === "flag" ? "Flag" : "Logo"}
                        {(tab === "text" && pressureOptions[`${area}Text`]) || (tab === "flag" && pressureOptions[`${area}Flag`]) || (tab === "logo" && pressureOptions[`${area}LogoPredefined`]) ? " ✓" : ""}
                      </button>
                    ))}
                  </div>
                  {!pressureOptions[`${area}Type`] && (
                    <div className="flex flex-wrap gap-2">
                      <input type="text" value={pressureOptions[`${area}Text`]}
                        onChange={(e) => onUpdate({ pressureOptions: { ...pressureOptions, [`${area}Text`]: e.target.value } })}
                        placeholder="Enter text" maxLength={25}
                        className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                      />
                      {pressureOptions[`${area}Text`] && (
                        <button onClick={() => clearField(`${area}Text`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  )}
                  {pressureOptions[`${area}Type`] === "flag" && (
                    <div className="space-y-3">
                      {/* 1 or 2 flags toggle */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-600">Number of flags:</span>
                        <div className="flex rounded-lg overflow-hidden border border-gray-200">
                          {[1, 2].map((n) => (
                            <button key={n} type="button"
                              onClick={() => {
                                console.log("clicked", n);

                                const updatedOptions = {
                                  ...pressureOptions,
                                  [`${area}FlagCount`]: n,
                                  ...(n === 1 ? { [`${area}Flag2`]: "" } : {}),
                                };

                                console.log("updatedOptions", updatedOptions);

                                onUpdate({
                                  pressureOptions: updatedOptions,
                                });
                              }}
                              className={`px-4 py-1.5 text-xs font-bold transition-all ${(pressureOptions[`${area}FlagCount`] || 1) === n
                                ? "bg-green-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                                }`}
                            >{n}</button>
                          ))}
                        </div>
                      </div>

                      {/* Flag 1 */}
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          {(Number(pressureOptions[`${area}FlagCount`] || 1) === 2) ? "Flag 1 (50% size)" : "Flag"}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <input type="text" value={getFlagDisplay(pressureOptions[`${area}Flag`])} readOnly placeholder="Select flag"
                            className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer"
                            onClick={() => handleFlagSelect(`${area}Flag`)}
                          />
                          <button onClick={() => handleFlagSelect(`${area}Flag`)} className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 text-sm font-medium">Select</button>
                          {pressureOptions[`${area}Flag`] && <button onClick={() => clearField(`${area}Flag`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                      </div>

                      {/* Flag 2 — only if count = 2 */}
                      {(Number(pressureOptions[`${area}FlagCount`] || 1) === 2) && (
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Flag 2 (50% size)</label>
                          <div className="flex flex-wrap gap-2">
                            <input type="text" value={getFlagDisplay(pressureOptions[`${area}Flag2`] || "")} readOnly placeholder="Select flag"
                              className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer"
                              onClick={() => handleFlagSelect(`${area}Flag2`)}
                            />
                            <button onClick={() => handleFlagSelect(`${area}Flag2`)} className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 text-sm font-medium">Select</button>
                            {pressureOptions[`${area}Flag2`] && <button onClick={() => clearField(`${area}Flag2`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {pressureOptions[`${area}Type`] === "logo" && (
                    <div className="flex flex-wrap gap-2">
                      <input type="text" value={getLogoDisplay(pressureOptions[`${area}LogoPredefined`])} readOnly placeholder="Select logo"
                        className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer"
                        onClick={() => handleFlagSelect(`${area}LogoPredefined`)}
                      />
                      <button onClick={() => handleFlagSelect(`${area}LogoPredefined`)} className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 text-sm font-medium">Select</button>
                      {pressureOptions[`${area}LogoPredefined`] && <button onClick={() => clearField(`${area}LogoPredefined`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Test Component - visible only in pressure tab, but always mounted for back design broadcast */}
      <div className={activeTab === "pressure" ? "mt-10" : ""} style={activeTab !== "pressure" ? { visibility: 'hidden', position: 'absolute', pointerEvents: 'none', height: 0, overflow: 'hidden' } : {}}>
        <Test
          key={`sweatshirt-test-${JSON.stringify(pressureOptions?.backDesign)}`}
          postEx="SweatShirt:"
          pressureOptions={pressureOptions}
          isAppReady={isAppReady}
          onUpdate={(update) => {
            if (update.canvasBase64) {
              const { diffuse, opacity, emissive } = update.canvasBase64;
              ["preview-iframe", "preview-iframe2"].forEach((id) => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                  iframe.contentWindow.postMessage(diffuse, "*");
                  iframe.contentWindow.postMessage(opacity, "*");
                  if (emissive) iframe.contentWindow.postMessage(emissive, "*");
                }
              });
            }
            if (update.backDesign !== undefined) {
              onUpdate({
                pressureOptions: {
                  ...pressureOptions,
                  backDesign: update.backDesign,
                },
              });
            }
          }}
        />
      </div>

      {/* Modal / Asset Picker */}
      {showFlagModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop with enhanced blur */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowFlagModal(false)}
          />

          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-7 border-b border-slate-50 bg-white/50 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-2xl">
                  {currentField.includes("Logo") ? (
                    <ImageIcon className="w-6 h-6 text-green-600" />
                  ) : (
                    <Flag className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-none">
                    {currentField.includes("Logo") ? "Select a Logo" : "Choose a Flag"}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1.5 font-medium">
                    {currentField.includes("Logo") ? "Pick a symbol for your design" : "Represent your country"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFlagModal(false)}
                className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all duration-200 group"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Selection Grid Area */}
            <div className="p-8 overflow-y-auto custom-scrollbar-premium bg-slate-50/30">
              {currentField.includes("Logo") ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {logos && logos.map((logo) => (
                    <button
                      key={logo.id}
                      onClick={() => selectLogo(logo.name, logo.id)}
                      className="group relative flex flex-col items-center p-2 rounded-3xl transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
                    >
                      <div className="w-full aspect-square mb-4 flex items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:border-green-200 group-hover:-translate-y-2 transition-all duration-500 p-5 overflow-hidden">
                        <img
                          src={`${BASE_URL}${logo.file_path}`.replace(/\\/g, '/')}
                          alt={logo.name}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                        />
                        {/* Hover Overlay Overlay */}
                        <div className="absolute inset-0 bg-green-600/0 group-hover:bg-green-600/5 transition-colors duration-300" />
                      </div>
                      <span className="text-xs font-bold text-slate-500 group-hover:text-green-700 truncate w-full px-2 text-center uppercase tracking-wider transition-colors">
                        {logo.name}
                      </span>

                      {/* Active Indicator (Hidden by default) */}
                      <div className="absolute top-4 right-4 bg-green-600 rounded-full p-1 opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 shadow-lg">
                        <X className="w-3 h-3 text-white rotate-45" />
                      </div>
                    </button>
                  ))}

                  {(!logos || logos.length === 0) && (
                    <div className="col-span-full py-20 text-center">
                      <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-400 font-bold text-lg">No logos found</p>
                      <p className="text-slate-400/60 text-sm">Logos assigned to your class will appear here.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {countries.map((country) => (
                    <button
                      key={country.name}
                      onClick={() => selectFlag(country.name)}
                      className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-white border border-slate-100 hover:border-green-300 hover:shadow-lg hover:shadow-green-900/5 hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden shadow-sm bg-slate-100 group-hover:ring-4 group-hover:ring-green-50 transition-all duration-300">
                        <img
                          src={country.flag}
                          alt={country.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 leading-tight uppercase tracking-wider text-center">
                        {country.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Helper Footer */}
            <div className="px-8 py-5 border-t border-slate-50 bg-white flex justify-center items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                Choose an asset to customize your placement
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SweatShirt;



