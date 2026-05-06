import React, { useState, useEffect } from "react";
import cog from "../assets/menuimages/cogwheel-pen.png";
import plus from "../assets/menuimages/shirt-plus.png";
import Test from "./Test";
import { BASE_URL } from "../utils/const";
import { ALL_FLAGS } from "../utils/flags";
import { X, Image as ImageIcon, Trash2, Globe, Loader2, CheckCircle, Flag } from "lucide-react";
import { getCountries, getLibraryDesigns } from "../api/api";
import UploadRequestModal from "./UploadRequestModal";

const Hoodie = ({ data, onUpdate, isAppReady, logos, onOpenInquiry, activeTab: externalTab, onTabChange }) => {
  const [internalTab, setInternalTab] = useState("size");
  const activeTab = externalTab ?? internalTab;
  const setActiveTab = (tab) => { setInternalTab(tab); onTabChange?.(tab); };
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [currentField, setCurrentField] = useState("");

  // Library state
  const [libCountries, setLibCountries] = useState([]);
  const [libSelectedCountry, setLibSelectedCountry] = useState(null);
  const [libDesigns, setLibDesigns] = useState([]);
  const [libCountriesLoading, setLibCountriesLoading] = useState(false);
  const [libDesignsLoading, setLibDesignsLoading] = useState(false);
  const [libSelectedDesign, setLibSelectedDesign] = useState(null);

  // Upload own design state
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const fetchLibCountries = async () => {
      setLibCountriesLoading(true);
      try {
        const res = await getCountries();
        if (res.data?.success) { const list = res.data.data || []; setLibCountries(list); if (list.length > 0) setLibSelectedCountry(list[0]); }
      } catch (e) { console.error(e); } finally { setLibCountriesLoading(false); }
    };
    fetchLibCountries();
  }, []);

  useEffect(() => {
    if (!libSelectedCountry) return;
    const fetchDesigns = async () => {
      setLibDesignsLoading(true); setLibDesigns([]);
      try {
        const res = await getLibraryDesigns(libSelectedCountry.id);
        if (res.data?.success) setLibDesigns(res.data.data || []);
      } catch (e) { console.error(e); } finally { setLibDesignsLoading(false); }
    };
    fetchDesigns();
  }, [libSelectedCountry]);
  const selectedColor = data?.selectedColor || "Red";
  const selectedSize = data?.selectedSize || "";
  const pressureOptions = data?.pressureOptions || {
    rightChestText: "", rightChestFlag: "", rightChestLogoPredefined: "", rightChestLogoCustom: "", rightChestType: "",
    leftChestText: "", leftChestFlag: "", leftChestLogoPredefined: "", leftChestLogoCustom: "", leftChestType: "",
    bottomChestText: "", bottomChestFlag: "", bottomChestLogoPredefined: "", bottomChestLogoCustom: "", bottomChestType: "",
    rightSleeveText: "", rightSleeveFlag: "", rightSleeveLogoPredefined: "", rightSleeveLogoCustom: "", rightSleeveType: "",
    leftSleeveText: "", leftSleeveFlag: "", leftSleeveLogoPredefined: "", leftSleeveLogoCustom: "", leftSleeveType: "",
    backDesign: null,
  };
  const countries = ALL_FLAGS;
  const flagImages = Object.fromEntries(ALL_FLAGS.map(f => [f.name, f.flagHD || f.flag]));
  const CANVAS_WIDTH = 320, TEXT_HEIGHT = 120, FLAG_HEIGHT = 240, CANVAS_HEIGHT = 360;

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

      const DIVIDER_W = 2;
      const BOX_W = (CANVAS_WIDTH - DIVIDER_W) / 2;
      const BOX_H = Math.round(FLAG_HEIGHT * 0.4);
      const BOX_Y = TEXT_HEIGHT + (FLAG_HEIGHT - BOX_H) / 2;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, BOX_Y, BOX_W, BOX_H);
      ctx.fillRect(BOX_W + DIVIDER_W, BOX_Y, BOX_W, BOX_H);
    }
    return canvas.toDataURL("image/png");
  };

  const getDiffuseBase64 = (
    flag,
    logoPre,
    logoCustom,
    text,
    callback,
    flag2 = "",
    flagCount = 1,
    textColor = "#ffffff"
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
        ctx.fillStyle = textColor || "#ffffff";
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
      ctx.fillStyle = textColor || "#ffffff";
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

    // ---------- 2 FLAGS SIDE BY SIDE ----------
    if (hasTwoFlags) {
      const DIVIDER_W = 2;
      const BOX_W = (CANVAS_WIDTH - DIVIDER_W) / 2;
      const BOX_H = Math.round(FLAG_HEIGHT * 0.4);
      const BOX_Y = TEXT_HEIGHT + (FLAG_HEIGHT - BOX_H) / 2;

      const drawFlagInBox = (img, x, y, w, h) => {
        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = x + (w - dw) / 2;
        const dy = y + (h - dh) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      };

      Promise.all([
        loadImage(flagImages[flag]),
        loadImage(flagImages[flag2]),
      ])
        .then(([img1, img2]) => {
          drawFlagInBox(img1, 0, BOX_Y, BOX_W, BOX_H);
          drawFlagInBox(img2, BOX_W + DIVIDER_W, BOX_Y, BOX_W, BOX_H);
          ctx.fillStyle = "#000";
          ctx.fillRect(BOX_W, BOX_Y, DIVIDER_W, BOX_H);
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

      return;
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

  const handleFlagSelect = (field) => { setCurrentField(field); setShowFlagModal(true); };
  const selectFlag = (name) => { onUpdate({ pressureOptions: { ...pressureOptions, [currentField]: name } }); setShowFlagModal(false); };
  const selectLogo = (name, id) => { onUpdate({ pressureOptions: { ...pressureOptions, [currentField]: name, selectedLogoId: id } }); setShowFlagModal(false); };
  const clearField = (field) => { onUpdate({ pressureOptions: { ...pressureOptions, [field]: "" } }); };
  const getFlagDisplay = (n) => n || "";
  const getLogoDisplay = (n) => n || "";

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

  useEffect(() => {
    if (logos && logos.length === 1) {
      const fs = ["rightChestLogoPredefined", "leftChestLogoPredefined", "bottomChestLogoPredefined", "rightSleeveLogoPredefined", "leftSleeveLogoPredefined"];
      if (!fs.some(f => pressureOptions[f])) onUpdate({ pressureOptions: { ...pressureOptions, rightChestLogoPredefined: logos[0].name, selectedLogoId: logos[0].id } });
    }
  }, [logos]);

  useEffect(() => {
    const m = { red: "Hoodie:red", black: "Hoodie:black", white: "Hoodie:white", natural: "Hoodie:natural", "heather grey": "Hoodie:heatherGrey", navy: "Hoodie:navy", "light pink": "Hoodie:lightPink", "olive green": "Hoodie:oliveGreen", blue: "Hoodie:blue", purple: "Hoodie:purple" };
    const msg = m[selectedColor.toLowerCase()]; if (!msg) return;
    ["preview-iframe", "preview-iframe2"].forEach(id => { const f = document.getElementById(id); if (f?.contentWindow) f.contentWindow.postMessage(msg, "*"); });
  }, [selectedColor, isAppReady]);

  useEffect(() => {
    if (!selectedSize) return;
    ["preview-iframe", "preview-iframe2"].forEach(id => { const f = document.getElementById(id); if (f?.contentWindow) f.contentWindow.postMessage(`Hoodie:size:${selectedSize}`, "*"); });
  }, [selectedSize, isAppReady]);

  const prevRef = React.useRef({});
  useEffect(() => {
    ["rightChest", "leftChest", "bottomChest", "rightSleeve", "leftSleeve"].forEach(area => {
      const text = pressureOptions[`${area}Text`]?.trim() || "", flag = pressureOptions[`${area}Flag`] || "", flag2 = pressureOptions[`${area}Flag2`] || "", flagCount = pressureOptions[`${area}FlagCount`] || 1, logoPre = pressureOptions[`${area}LogoPredefined`] || "", logoCustom = pressureOptions[`${area}LogoCustom`] || "", type = pressureOptions[`${area}Type`] || "";
      const textColor = pressureOptions[`${area}TextColor`] || "#ffffff";
      const p = prevRef.current[area] || {};
      if (p.text === text && p.flag === flag && p.flag2 === flag2 && p.flagCount === flagCount && p.logoPre === logoPre && p.logoCustom === logoCustom && p.type === type && p.textColor === textColor) return;
      prevRef.current[area] = { text, flag, flag2, flagCount, logoPre, logoCustom, type, textColor };
      const hasFlag = !!flag && type === "flag", hasLogo = !!(logoPre || logoCustom) && type === "logo";
      const hasSecondAsset = !!flag2;

      const opacity = getEmissiveBase64(text, hasFlag, hasLogo, hasSecondAsset);
      ["preview-iframe", "preview-iframe2"].forEach(id => { const f = document.getElementById(id); if (f?.contentWindow) f.contentWindow.postMessage(`Hoodie:${area}_opacity: ${opacity}`, "*"); });
      getDiffuseBase64(flag, logoPre, logoCustom, text, d => {
        ["preview-iframe", "preview-iframe2"].forEach(id => { const f = document.getElementById(id); if (f?.contentWindow) f.contentWindow.postMessage(`Hoodie:${area}_diffuse: ${d}`, "*"); });
      }, flag2, flagCount, textColor);
    });
  }, [isAppReady, pressureOptions]);

  const colors = [{ name: "Red", value: "#E61709", border: "#E61709" }, { name: "Black", value: "#120F14", border: "#120F14" }, { name: "White", value: "#FFFFFF", border: "#D1D5DB" }, { name: "Natural", value: "#FFFAD9", border: "#FFFAD9" }, { name: "Heather Grey", value: "#D4D9DC", border: "#D4D9DC" }, { name: "Navy", value: "#051734", border: "#051734" }, { name: "Light Pink", value: "#F0A5C7", border: "#F0A5C7" }, { name: "Olive Green", value: "#63673F", border: "#63673F" }, { name: "Blue", value: "#0000FF", border: "#0000FF" }, { name: "Purple", value: "#431279", border: "#431279" }];
  const sizes = ["S", "M", "L", "XL", "2XL", "3XL"];

  const renderChestArea = (area) => (
    <div key={area} className="bg-white rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-gray-900 mb-3">{area === "bottomChest" ? "Bottom Chest:" : area === "rightChest" ? "Right Chest:" : "Left Chest:"}</h3>
      <div className="space-y-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {["text", "flag", "logo"].map(tab => (
            <button key={tab} type="button"
              onClick={() => { if (tab === "text") onUpdate({ pressureOptions: { ...pressureOptions, [`${area}Type`]: "", [`${area}Flag`]: "", [`${area}LogoPredefined`]: "", [`${area}LogoCustom`]: "" } }); else handleTypeChange(area, tab); }}
              className={`flex-1 py-2 text-xs font-bold capitalize transition-all ${pressureOptions[`${area}Type`] === tab || (tab === "text" && !pressureOptions[`${area}Type`]) ? "bg-green-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
              {tab === "text" ? "Text" : tab === "flag" ? "Flag" : "Logo"}{(tab === "text" && pressureOptions[`${area}Text`]) || (tab === "flag" && pressureOptions[`${area}Flag`]) || (tab === "logo" && pressureOptions[`${area}LogoPredefined`]) ? " ✓" : ""}
            </button>
          ))}
        </div>
        {!pressureOptions[`${area}Type`] && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <input type="text" value={pressureOptions[`${area}Text`]} onChange={e => onUpdate({ pressureOptions: { ...pressureOptions, [`${area}Text`]: e.target.value } })} placeholder="Enter text" maxLength={25} className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500" />
              {pressureOptions[`${area}Text`] && <button onClick={() => clearField(`${area}Text`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
            </div>
            {pressureOptions[`${area}Text`] && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Text color:</span>
                {["#ffffff", "#000000"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onUpdate({ pressureOptions: { ...pressureOptions, [`${area}TextColor`]: color } })}
                    title={color === "#ffffff" ? "White" : "Black"}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: (pressureOptions[`${area}TextColor`] || "#ffffff") === color ? "#16a34a" : "#d1d5db",
                      boxShadow: (pressureOptions[`${area}TextColor`] || "#ffffff") === color ? "0 0 0 2px #16a34a" : "none",
                    }}
                  />
                ))}
                <span className="text-xs text-gray-400">
                  {(pressureOptions[`${area}TextColor`] || "#ffffff") === "#ffffff" ? "White" : "Black"}
                </span>
              </div>
            )}
          </div>
        )} 
        {pressureOptions[`${area}Type`] === "flag" && (
          <div className="flex flex-wrap gap-2">
            <input type="text" value={getFlagDisplay(pressureOptions[`${area}Flag`])} readOnly placeholder="Select flag" className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer" onClick={() => handleFlagSelect(`${area}Flag`)} />
            <button onClick={() => handleFlagSelect(`${area}Flag`)} className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 text-sm font-medium">Select</button>
            {pressureOptions[`${area}Flag`] && <button onClick={() => clearField(`${area}Flag`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
          </div>
        )}
        {pressureOptions[`${area}Type`] === "logo" && (
          <div className="flex flex-wrap gap-2">
            <input type="text" value={getLogoDisplay(pressureOptions[`${area}LogoPredefined`])} readOnly placeholder="Select logo" className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer" onClick={() => handleFlagSelect(`${area}LogoPredefined`)} />
            <button onClick={() => handleFlagSelect(`${area}LogoPredefined`)} className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 text-sm font-medium">Select</button>
            {pressureOptions[`${area}LogoPredefined`] && <button onClick={() => clearField(`${area}LogoPredefined`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
          </div>
        )}
      </div>
    </div>
  );

  const renderSleeveArea = (area) => (
    <div key={area} className="bg-white rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-gray-900 mb-3">{area === "rightSleeve" ? "Right Sleeve:" : "Left Sleeve:"}</h3>
      <div className="space-y-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {["text", "flag", "logo"].map(tab => (
            <button key={tab} type="button"
              onClick={() => { if (tab === "text") onUpdate({ pressureOptions: { ...pressureOptions, [`${area}Type`]: "", [`${area}Flag`]: "", [`${area}LogoPredefined`]: "", [`${area}LogoCustom`]: "" } }); else handleTypeChange(area, tab); }}
              className={`flex-1 py-2 text-xs font-bold capitalize transition-all ${pressureOptions[`${area}Type`] === tab || (tab === "text" && !pressureOptions[`${area}Type`]) ? "bg-green-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
              {tab === "text" ? "Text" : tab === "flag" ? "Flag" : "Logo"}{(tab === "text" && pressureOptions[`${area}Text`]) || (tab === "flag" && pressureOptions[`${area}Flag`]) || (tab === "logo" && pressureOptions[`${area}LogoPredefined`]) ? " ✓" : ""}
            </button>
          ))}
        </div>
        {!pressureOptions[`${area}Type`] && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <input type="text" value={pressureOptions[`${area}Text`]} onChange={e => onUpdate({ pressureOptions: { ...pressureOptions, [`${area}Text`]: e.target.value } })} placeholder="Enter text" maxLength={25} className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500" />
              {pressureOptions[`${area}Text`] && <button onClick={() => clearField(`${area}Text`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
            </div>
            {pressureOptions[`${area}Text`] && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Text color:</span>
                {["#ffffff", "#000000"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onUpdate({ pressureOptions: { ...pressureOptions, [`${area}TextColor`]: color } })}
                    title={color === "#ffffff" ? "White" : "Black"}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: (pressureOptions[`${area}TextColor`] || "#ffffff") === color ? "#16a34a" : "#d1d5db",
                      boxShadow: (pressureOptions[`${area}TextColor`] || "#ffffff") === color ? "0 0 0 2px #16a34a" : "none",
                    }}
                  />
                ))}
                <span className="text-xs text-gray-400">
                  {(pressureOptions[`${area}TextColor`] || "#ffffff") === "#ffffff" ? "White" : "Black"}
                </span>
              </div>
            )}
          </div>
        )}
        {pressureOptions[`${area}Type`] === "flag" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-600">Number of flags:</span>
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                {[1, 2].map(n => (
                  <button key={n} type="button" onClick={() => onUpdate({ pressureOptions: { ...pressureOptions, [`${area}FlagCount`]: n, ...(n === 1 ? { [`${area}Flag2`]: "" } : {}) } })}
                    className={`px-4 py-1.5 text-xs font-bold transition-all ${(pressureOptions[`${area}FlagCount`] || 1) === n ? "bg-green-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{Number(pressureOptions[`${area}FlagCount`] || 1) === 2 ? "Flag 1 (50% size)" : "Flag"}</label>
              <div className="flex flex-wrap gap-2">
                <input type="text" value={getFlagDisplay(pressureOptions[`${area}Flag`])} readOnly placeholder="Select flag" className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer" onClick={() => handleFlagSelect(`${area}Flag`)} />
                <button onClick={() => handleFlagSelect(`${area}Flag`)} className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 text-sm font-medium">Select</button>
                {pressureOptions[`${area}Flag`] && <button onClick={() => clearField(`${area}Flag`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
            {Number(pressureOptions[`${area}FlagCount`] || 1) === 2 && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Flag 2 (50% size)</label>
                <div className="flex flex-wrap gap-2">
                  <input type="text" value={getFlagDisplay(pressureOptions[`${area}Flag2`] || "")} readOnly placeholder="Select flag" className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer" onClick={() => handleFlagSelect(`${area}Flag2`)} />
                  <button onClick={() => handleFlagSelect(`${area}Flag2`)} className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 text-sm font-medium">Select</button>
                  {pressureOptions[`${area}Flag2`] && <button onClick={() => clearField(`${area}Flag2`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            )}
          </div>
        )}
        {pressureOptions[`${area}Type`] === "logo" && (
          <div className="flex flex-wrap gap-2">
            <input type="text" value={getLogoDisplay(pressureOptions[`${area}LogoPredefined`])} readOnly placeholder="Select logo" className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer" onClick={() => handleFlagSelect(`${area}LogoPredefined`)} />
            <button onClick={() => handleFlagSelect(`${area}LogoPredefined`)} className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 text-sm font-medium">Select</button>
            {pressureOptions[`${area}LogoPredefined`] && <button onClick={() => clearField(`${area}LogoPredefined`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
          </div>
        )}
      </div>
    </div>
  );

  const Modal = () => showFlagModal ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowFlagModal(false)} />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-8 py-7 border-b border-slate-50 bg-white/50 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-2xl">{currentField.includes("Logo") ? <ImageIcon className="w-6 h-6 text-green-600" /> : <Flag className="w-6 h-6 text-green-600" />}</div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 leading-none">{currentField.includes("Logo") ? "Select a Logo" : "Choose a Flag"}</h2>
              <p className="text-slate-500 text-sm mt-1.5 font-medium">{currentField.includes("Logo") ? "Pick a symbol for your design" : "Represent your country"}</p>
            </div>
          </div>
          <button onClick={() => setShowFlagModal(false)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all group"><X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" /></button>
        </div>
        <div className="p-8 overflow-y-auto bg-slate-50/30">
          {currentField.includes("Logo") ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {logos && logos.map(logo => (
                <button key={logo.id} onClick={() => selectLogo(logo.name, logo.id)} className="group relative flex flex-col items-center p-2 rounded-3xl hover:bg-white hover:shadow-xl transition-all duration-300">
                  <div className="w-full aspect-square mb-4 flex items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:border-green-200 group-hover:-translate-y-2 transition-all duration-500 p-5 overflow-hidden">
                    <img src={`${BASE_URL}${logo.file_path}`.replace(/\\/g, "/")} alt={logo.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-green-700 truncate w-full px-2 text-center uppercase tracking-wider">{logo.name}</span>
                </button>
              ))}
              {(!logos || logos.length === 0) && <div className="col-span-full py-20 text-center"><ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-4" /><p className="text-slate-400 font-bold">No logos found</p></div>}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {countries.map(c => (
                <button key={c.name} onClick={() => selectFlag(c.name)} className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-white border border-slate-100 hover:border-green-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-16 h-12 rounded-lg overflow-hidden shadow-sm bg-slate-100"><img src={c.flag} alt={c.name} className="w-full h-full object-cover" /></div>
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-wider text-center">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-8 py-5 border-t border-slate-50 bg-white flex justify-center items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Choose an asset to customize your placement</p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="max-w-md mx-auto bg-gray-50 flex flex-col" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* <div className="flex gap-2 p-4 pb-2">
        <button onClick={() => setActiveTab("size")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm ${activeTab === "size" ? "bg-white shadow-sm border-2 border-green-700" : "bg-white border-2 border-transparent hover:border-gray-300"}`}>
          <span className="font-medium text-gray-900">Color & Size</span><img className="w-6" src={cog} alt="settings" />
        </button>
        <button onClick={() => setActiveTab("pressure")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm ${activeTab === "pressure" ? "bg-white shadow-sm border-2 border-green-700" : "bg-white border-2 border-transparent hover:border-gray-300"}`}>
          <span className="font-medium text-gray-900">Design</span><img className="w-6" src={plus} alt="add" />
        </button>
      </div> */}
      {activeTab === "size" ? (
        <div className="flex flex-col flex-1 relative px-4 pb-36">
          <h1 className="text-lg font-bold mb-3 text-gray-900">Hoodie</h1>
          {/* Color — 2-row grid */}
          <div className="mb-4">
            <h2 className="text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wide">Color</h2>
            <div className="grid grid-flow-col grid-rows-1 gap-2 w-fit">
              {colors.map(c => (
                <button key={c.name} title={c.name} onClick={() => onUpdate({ selectedColor: c.name })}
                  className="relative w-8 h-8 rounded-md transition-all focus:outline-none"
                  style={{ backgroundColor: c.value, border: selectedColor === c.name ? `2px solid ${c.border}` : `1px solid ${c.border}`, boxShadow: selectedColor === c.name ? `0 0 0 2px white, 0 0 0 3px ${c.border}` : "none" }}>
                  {selectedColor === c.name && <div className="absolute inset-0 rounded-md border border-white pointer-events-none" />}
                </button>
              ))}
            </div>
            {selectedColor && <p className="text-xs text-gray-500 mt-1.5">{selectedColor}</p>}
          </div>
          {/* Size */}
          <div className="mb-5">
            <h2 className="text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wide">Size</h2>
            <div className="flex flex-wrap gap-2">
              {sizes.map(s => <button key={s} onClick={() => onUpdate({ selectedSize: s })} className={`py-1.5 px-3 rounded-lg border-2 transition-all font-medium text-sm ${selectedSize === s ? "border-gray-900 bg-white text-gray-900" : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"}`}>{s}</button>)}
            </div>
          </div>
          {/* ── Back Design Library ── */}
          <div className="mb-4">
            <h2 className="text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Back Design Library
            </h2>
            {/* Country dropdown */}
            {libCountriesLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading countries...
              </div>
            ) : (
              <div className="mb-3">
                <div className="max-h-36 overflow-y-auto pr-1 custom-scrollbar-premium"><div className="grid grid-cols-3 gap-1.5">
                  {libCountries.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setLibSelectedCountry(c)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold text-center transition-all border truncate ${
                        libSelectedCountry?.id === c.id
                          ? 'bg-green-600 text-white border-green-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div></div>
              </div>
            )}
            {libDesignsLoading ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
            ) : libDesigns.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No designs for this country</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {libDesigns.map(design => {
                  const rawPath = (design.file_path || design.image_path || design.thumbnail || "").replace(/\\/g, "/"); const src = rawPath.startsWith("http") ? rawPath : `${BASE_URL}${rawPath.startsWith("/") ? rawPath.slice(1) : rawPath}`;
                  const isSelected = libSelectedDesign?.id === design.id;
                  return (
                    <button key={design.id} onClick={() => { setLibSelectedDesign(design); onUpdate({ pressureOptions: { ...pressureOptions, backDesign: { src, designId: design.id, pos: { x: 200, y: 200 }, size: { w: 300, h: 300 }, angle: 0, locked: true } } }); }}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all bg-white ${isSelected ? 'border-green-500 shadow-md' : 'border-gray-200 hover:border-green-300'}`}>
                      <img src={src} alt={design.name} className="w-full h-full object-contain p-1.5" onError={e => { e.target.style.display = 'none'; }} />
                      {isSelected && <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 text-white" /></div>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {/* Upload own design + Add classmates names */}
          <div className="mb-4 flex flex-col gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full py-2 px-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 text-sm font-semibold hover:border-green-500 hover:text-green-700 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload own design
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full py-2 px-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 text-sm font-semibold hover:border-green-500 hover:text-green-700 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Add classmates names
            </button>
          </div>
          {/* Next */}
          {/* <div className="absolute bottom-0 left-0 right-0 p-3 bg-gray-50 border-t border-gray-200">
            <button onClick={() => setActiveTab("pressure")} className="w-full py-2.5 bg-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 transition text-sm flex items-center justify-center gap-2">
              Next — Design
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div> */}
        </div>
      ) : (
        <div className="flex flex-col flex-1 relative px-4 pb-36">
          <h1 className="text-lg font-bold mb-4 text-gray-900">Design Options</h1>
          <div className="mb-6"><h2 className="text-xl font-semibold text-gray-900 mb-4">Chest Area</h2>{["rightChest", "leftChest", "bottomChest"].map(renderChestArea)}</div>
          <div className="mb-6"><h2 className="text-xl font-semibold text-gray-900 mb-4">Sleeves</h2>{["rightSleeve", "leftSleeve"].map(renderSleeveArea)}</div>
          {/* Back */}
          {/* <div className="absolute bottom-0 left-0 right-0 p-3 bg-gray-50 border-t border-gray-200">
            <button onClick={() => setActiveTab("size")} className="w-full py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition text-sm flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
          </div> */}
        </div>
      )}
      <div className={activeTab === "pressure" ? "mt-10" : ""} style={activeTab !== "pressure" ? { visibility: "hidden", position: "absolute", pointerEvents: "none", height: 0, overflow: "hidden" } : {}}>
        <Test postEx="Hoodie:" pressureOptions={pressureOptions} isAppReady={isAppReady} onUpdate={u => {
          if (u.canvasBase64) { const { diffuse, opacity, emissive } = u.canvasBase64;["preview-iframe", "preview-iframe2"].forEach(id => { const f = document.getElementById(id); if (f?.contentWindow) { f.contentWindow.postMessage(diffuse, "*"); f.contentWindow.postMessage(opacity, "*"); if (emissive) f.contentWindow.postMessage(emissive, "*"); } }); }
          if (u.backDesign !== undefined) onUpdate({ pressureOptions: { ...pressureOptions, backDesign: u.backDesign } });
        }} />
      </div>
      <Modal />
      <UploadRequestModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSendRequest={() => onOpenInquiry?.()}
      />
    </div>
  );
};

export default Hoodie;
