import React, { useState, useEffect } from "react";
import cog from "../assets/menuimages/cogwheel-pen.png";
import plus from "../assets/menuimages/shirt-plus.png";
import Test from "./Test";
import { BASE_URL } from "../utils/const";
import { ALL_FLAGS } from "../utils/flags";
import { X, Search, Image as ImageIcon, Trash2, Globe, Loader2, CheckCircle, Flag } from "lucide-react";
import { getCountries, getLibraryDesigns } from "../api/api";
import UploadRequestModal from "./UploadRequestModal";


const Tshirt = ({ data, onUpdate, isAppReady, logos, backDesigns, onOpenInquiry, activeTab: externalTab, onTabChange }) => {
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

  // Upload own design state
  const [classSignedUp, setClassSignedUp] = useState(null); // null=unknown, true, false
  const [signupCheckLoading, setSignupCheckLoading] = useState(false);
  const [showUploadMsg, setShowUploadMsg] = useState(false);

  useEffect(() => {
    const fetchLibCountries = async () => {
      setLibCountriesLoading(true);
      try {
        const res = await getCountries();
        if (res.data?.success) {
          const list = res.data.data || [];
          setLibCountries(list);
          if (list.length > 0) setLibSelectedCountry(list[0]);
        }
      } catch (e) { console.error(e); }
      finally { setLibCountriesLoading(false); }
    };
    fetchLibCountries();
  }, []);

  useEffect(() => {
    if (!libSelectedCountry) return;
    const fetchDesigns = async () => {
      setLibDesignsLoading(true);
      setLibDesigns([]);
      try {
        const res = await getLibraryDesigns(libSelectedCountry.id);
        if (res.data?.success) setLibDesigns(res.data.data || []);
      } catch (e) { console.error(e); }
      finally { setLibDesignsLoading(false); }
    };
    fetchDesigns();
  }, [libSelectedCountry]);

  const selectedColor = data?.selectedColor || "Red";
  const selectedSize = data?.selectedSize || "";

  const pressureOptions = data?.pressureOptions || {
    rightChestText: "",
    rightChestFlag: "",
    rightChestLogoPredefined: "",
    rightChestLogoCustom: "",
    rightChestType: "",

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

  const countries = ALL_FLAGS;
  const flagImages = Object.fromEntries(ALL_FLAGS.map(f => [f.name, f.flagHD || f.flag]));

  const CANVAS_WIDTH = 320;
  const TEXT_HEIGHT = 120;
  const FLAG_HEIGHT = 240;
  const CANVAS_HEIGHT = TEXT_HEIGHT + FLAG_HEIGHT;

  // ── Shared layout constants for 2-flag split ──────────────────────────
  const DIVIDER_W = 2;
  const BOX_W = (CANVAS_WIDTH - DIVIDER_W) / 2;
  const BOX_H = Math.round(CANVAS_HEIGHT * 0.4);
  const BOX_Y = TEXT_HEIGHT + (FLAG_HEIGHT - BOX_H) / 2; // vertically centered in flag area

  const drawCover = (ctx, img, x, y, w, h) => {
    // cover: scale to fill box completely, clip overflow — equal sizing for all flags
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

  const getEmissiveBase64 = (text, hasFlag = false, hasLogo = false, hasSecondAsset = false, flagCount = 1, flag = "", flag2 = "") => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");

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

    if (hasFlag && flagCount === 2 && flag && flag2) {
      // Emissive = pure white mask only — no actual flag colors
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, BOX_Y, BOX_W, BOX_H);
      ctx.fillRect(BOX_W + DIVIDER_W, BOX_Y, BOX_W, BOX_H);

      // black divider = no-print zone
      ctx.fillStyle = "#000000";
      ctx.fillRect(BOX_W, BOX_Y, DIVIDER_W, BOX_H);
    } else if (hasFlag || hasLogo) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, TEXT_HEIGHT, CANVAS_WIDTH, FLAG_HEIGHT);
    }

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 40;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    return canvas.toDataURL("image/png");
  };
  const getDiffuseBase64 = async (flag, logoPre, logoCustom, text, callback, flag2 = "") => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");

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

    try {
      const flagDrawn = await drawFlags(ctx, flag, flag2);
      if (!flagDrawn) await drawLogo(ctx, logoPre, logoCustom);
    } catch (e) {
      console.error("Render error:", e);
    }

    callback(canvas.toDataURL("image/png"));
  };
  const drawFlags = async (ctx, flag, flag2) => {
    const loadImage = (src) => new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });

    if (flag && flag2 && flagImages[flag] && flagImages[flag2]) {
      const [img1, img2] = await Promise.all([
        loadImage(flagImages[flag]),
        loadImage(flagImages[flag2]),
      ]);

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, BOX_Y, BOX_W, BOX_H);
      ctx.fillRect(BOX_W + DIVIDER_W, BOX_Y, BOX_W, BOX_H);

      drawCover(ctx, img1, 0, BOX_Y, BOX_W, BOX_H);
      drawCover(ctx, img2, BOX_W + DIVIDER_W, BOX_Y, BOX_W, BOX_H);

      ctx.fillStyle = "#000";
      ctx.fillRect(BOX_W, BOX_Y, DIVIDER_W, BOX_H);

      return true;
    }

    if (flag && flagImages[flag]) {
      const img = await loadImage(flagImages[flag]);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, TEXT_HEIGHT, CANVAS_WIDTH, FLAG_HEIGHT);
      drawCover(ctx, img, 0, TEXT_HEIGHT, CANVAS_WIDTH, FLAG_HEIGHT);
      return true;
    }

    return false;
  };

  const drawLogo = async (ctx, logoPre, logoCustom) => {
    let logoSrc = logoCustom;

    if (!logoSrc && logoPre) {
      const found = logos.find((l) => l.name === logoPre);
      if (found?.file_path) {
        logoSrc = `${BASE_URL}${found.file_path.replace(/\\/g, "/")}`;
      }
    }

    if (!logoSrc) return false;

    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = logoSrc;
    });

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, TEXT_HEIGHT, CANVAS_WIDTH, FLAG_HEIGHT);

    const ratio = Math.min(
      CANVAS_WIDTH / img.width,
      FLAG_HEIGHT / img.height
    );

    const w = img.width * ratio * 0.8;
    const h = img.height * ratio * 0.8;
    const x = (CANVAS_WIDTH - w) / 2;
    const y = TEXT_HEIGHT + (FLAG_HEIGHT - h) / 2;
    ctx.drawImage(img, x, y, w, h);

    return true;
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
        selectedLogoId: logoId,
      },
    });
    setShowFlagModal(false);
  };

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
        [`${area}Text`]: type === "" ? pressureOptions[`${area}Text`] : "",
        [`${area}LogoPredefined`]: type === "logo" ? pressureOptions[`${area}LogoPredefined`] : "",
        [`${area}LogoCustom`]: type === "logo" ? pressureOptions[`${area}LogoCustom`] : "",
      },
    });
  };

  useEffect(() => {
    const colorMap = {
      red: "T-Shirt:red",
      black: "T-Shirt:black",
      white: "T-Shirt:white",
      natural: "T-Shirt:natural",
      'heather grey': "T-Shirt:heatherGrey",
      navy: "T-Shirt:navy",
      'light pink': "T-Shirt:lightPink",
      'olive green': "T-Shirt:oliveGreen",
      blue: "T-Shirt:blue",
      purple: "T-Shirt:purple",
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

  useEffect(() => {
    if (!selectedSize) return;
    const message = `T-Shirt:size:${selectedSize}`;
    ["preview-iframe", "preview-iframe2"].forEach((id) => {
      const iframe = document.getElementById(id);
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(message, "*");
      }
    });
  }, [selectedSize, isAppReady]);

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

      prevPressureOptionsRef.current[area] = { text, flag, flag2, flagCount, logoPre, logoCustom, type };

      const hasFlag = !!flag && type === "flag";
      const hasLogo = !!(logoPre || logoCustom) && type === "logo";
      const hasSecondAsset = flagCount === 2 && !!flag && !!flag2;

      const opacity = getEmissiveBase64(text, hasFlag, hasLogo, hasSecondAsset, flagCount, flag, flag2);

      ["preview-iframe", "preview-iframe2"].forEach((id) => {
        const iframe = document.getElementById(id);
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(`T-Shirt:${area}_opacity: ${opacity}`, "*");
        }
      });

      getDiffuseBase64(flag, logoPre, logoCustom, text, (diffuseBase) => {
        ["preview-iframe", "preview-iframe2"].forEach((id) => {
          const iframe = document.getElementById(id);
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(`T-Shirt:${area}_diffuse: ${diffuseBase}`, "*");
          }
        });
      }, flag2);
    });
  }, [isAppReady, pressureOptions]);

  const handleBackDesignUpdate = (update) => {
    if (update.canvasBase64) {
      const { diffuse, opacity, emissive } = update.canvasBase64;
      ["preview-iframe", "preview-iframe2"].forEach((id) => {
        const iframe = document.getElementById(id);
        if (iframe?.contentWindow) {
          if (diffuse) iframe.contentWindow.postMessage(diffuse, "*");
          if (opacity) iframe.contentWindow.postMessage(opacity, "*");
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
  };

  useEffect(() => {
    if (pressureOptions?.backDesign && isAppReady) {
      console.log("Back design detected, triggering canvas update:", pressureOptions.backDesign);
    }
  }, [pressureOptions?.backDesign, isAppReady]);

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
    <div className="max-w-md mx-auto bg-gray-50 flex flex-col" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Tab Navigation */}
      {/* <div className="flex gap-2 p-4 pb-2">
        <button
          onClick={() => setActiveTab("size")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm ${activeTab === "size"
            ? "bg-white shadow-sm border-2 border-green-700"
            : "bg-white border-2 border-transparent hover:border-gray-300"
            }`}
        >
          <span className="font-medium text-gray-900">Color & Size</span>
          <img className="w-6" src={cog} alt="settings" />
        </button>
        <button
          onClick={() => setActiveTab("pressure")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm ${activeTab === "pressure"
            ? "bg-white shadow-sm border-2 border-green-700"
            : "bg-white border-2 border-transparent hover:border-gray-300"
            }`}
        >
          <span className="font-medium text-gray-900">Design</span>
          <img className="w-6" src={plus} alt="add" />
        </button>
      </div> */}

      {activeTab === "size" ? (
        <div className="flex flex-col flex-1 relative px-4 pb-36">
          <h1 className="text-lg font-bold mb-3 text-gray-900">T-shirt</h1>

          {/* Color — 2-row grid */}
          <div className="mb-4">
            <h2 className="text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wide">Color</h2>
            <div className="grid grid-flow-col grid-rows-1 gap-2 w-fit">
              {colors.map((color) => (
                <button
                  key={color.name}
                  title={color.name}
                  onClick={() => onUpdate({ selectedColor: color.name })}
                  className="relative w-8 h-8 rounded-md cursor-pointer transition-all focus:outline-none"
                  style={{
                    backgroundColor: color.value,
                    border: selectedColor === color.name ? `2px solid ${color.border}` : `1px solid ${color.border}`,
                    boxShadow: selectedColor === color.name ? `0 0 0 2px white, 0 0 0 3px ${color.border}` : "none",
                  }}
                >
                  {selectedColor === color.name && <div className="absolute inset-0 rounded-md border border-white pointer-events-none" />}
                </button>
              ))}
            </div>
            {selectedColor && <p className="text-xs text-gray-500 mt-1.5">{selectedColor}</p>}
          </div>

          {/* Size — compact */}
          <div className="mb-5">
            <h2 className="text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wide">Size</h2>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdate({ selectedSize: size })}
                  className={`py-1.5 px-3 rounded-lg border-2 transition-all font-medium text-sm ${selectedSize === size
                    ? "border-gray-900 bg-white text-gray-900"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                    }`}
                >
                  {size}
                </button>
              ))}
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

            {/* Designs grid */}
            {libDesignsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : libDesigns.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No designs for this country</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 pt-4">
                {libDesigns.map(design => {
                  const rawPath = (design.file_path || design.image_path || design.thumbnail || "").replace(/\\/g, "/"); const src = rawPath.startsWith("http") ? rawPath : `${BASE_URL}${rawPath.startsWith("/") ? rawPath.slice(1) : rawPath}`;
                  const isSelected = libSelectedDesign?.id === design.id;
                  return (
                    <button
                      key={design.id}
                      onClick={() => {
                        setLibSelectedDesign(design);
                        onUpdate({
                          pressureOptions: {
                            ...pressureOptions,
                            backDesign: {
                              src,
                              designId: design.id,
                              pos: { x: 200, y: 200 },
                              size: { w: 300, h: 300 },
                              angle: 0,
                              locked: true,
                            }
                          }
                        });
                      }}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all bg-white ${
                        isSelected ? 'border-green-500 shadow-md' : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <img src={src} alt={design.name} className="w-full h-full object-contain p-1.5" onError={e => { e.target.style.display = 'none'; }} />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
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

          {/* Next — absolute bottom */}
          {/* <div className="absolute bottom-0 left-0 right-0 p-3 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => setActiveTab("pressure")}
              className="w-full py-2.5 bg-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 transition text-sm flex items-center justify-center gap-2"
            >
              Next — Design
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div> */}
        </div>
      ) : (
        <div className="flex flex-col flex-1 relative px-4 pb-10">
          <h1 className="text-lg font-bold mb-4 text-gray-900">Design Options</h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chest Area</h2>

            {["rightChest", "leftChest"].map((area) => (
              <div key={area} className="bg-white rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {area === "rightChest" ? "Right Chest:" : "Left Chest:"}
                </h3>
                <div className="space-y-3">
                  <div className="flex rounded-lg overflow-hidden border border-gray-200">
                    {["text", "flag", "logo"].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
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

          {/* Back — absolute bottom */}
            {/* <div className="absolute bottom-0 left-0 right-0 p-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setActiveTab("size")}
                className="w-full py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div> */}
        </div>
      )}

      {/* Test Component - always mounted for back design broadcast */}
      <div className={activeTab === "pressure" ? "mt-10 px-4" : ""} style={activeTab !== "pressure" ? { visibility: 'hidden', position: 'absolute', pointerEvents: 'none', height: 0, overflow: 'hidden' } : {}}>
        <Test
          postEx="T-Shirt:"
          pressureOptions={pressureOptions}
          isAppReady={isAppReady}
          onUpdate={handleBackDesignUpdate}
          backDesigns={backDesigns}
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

      <UploadRequestModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSendRequest={() => onOpenInquiry?.()}
      />
    </div>
  );
};

export default Tshirt;


