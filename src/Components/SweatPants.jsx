// is me karna hay 

import React, { useState, useEffect } from "react";
import cog from "../assets/menuimages/cogwheel-pen.png";
import plus from "../assets/menuimages/shirt-plus.png";
// import Test1 from "./Test1";
import { BASE_URL } from "../utils/const";
import { ALL_FLAGS } from "../utils/flags";
import { X, Image as ImageIcon, Trash2, Flag } from "lucide-react";
import { TRANSLATE_MAP } from "../Default/translateMap";
import { postToPreview } from "../utils/postMessage";

const t = (key) => TRANSLATE_MAP[key] || key;

const SweatPants = ({ data, onUpdate, isAppReady, logos, onOpenInquiry, activeTab: externalTab, onTabChange, maxCharsText = 25 }) => {
  const [internalTab, setInternalTab] = useState("size");
  const activeTab = externalTab ?? internalTab;
  const setActiveTab = (tab) => { setInternalTab(tab); onTabChange?.(tab); };
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [currentField, setCurrentField] = useState("");

  const selectedColor = data?.selectedColor || "Heather Grey";
  const selectedSize = data?.selectedSize || "";

  const pressureOptions = data?.pressureOptions || {
    rightLegText: "", rightLegFlag: "", rightLegLogoPredefined: "", rightLegLogoCustom: "", rightLegType: "",
    leftLegText: "", leftLegFlag: "", leftLegLogoPredefined: "", leftLegLogoCustom: "", leftLegType: "",
    backDesign: null,
  };

  const countries = ALL_FLAGS;
  const flagImages = Object.fromEntries(ALL_FLAGS.map(f => [f.name, f.flagHD || f.flag]));

  const CANVAS_WIDTH = 320;
  const TEXT_HEIGHT = 120;
  const FLAG_HEIGHT = 240;
  const CANVAS_HEIGHT = TEXT_HEIGHT + FLAG_HEIGHT;

  const getEmissiveBase64 = (text, hasFlag = false, hasLogo = false) => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext("2d");

    // ---------- TEXT ----------
    if (text?.trim()) {
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

      ctx.fillText(text, CANVAS_WIDTH / 2, TEXT_HEIGHT + FLAG_HEIGHT / 2);
    }

    // ---------- FRAME (MATCH DIFFUSE EXACTLY) ----------
    if (hasFlag || hasLogo) {

      // white area (same as diffuse)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, TEXT_HEIGHT, CANVAS_WIDTH - 20, FLAG_HEIGHT);

      // top black strip (IMPORTANT FIX)
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, TEXT_HEIGHT, CANVAS_WIDTH, 20);

      // border (same thickness as diffuse)
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 40;
      ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    } else if (text?.trim()) {
      // Text-only: border to define print area
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 40;
      ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    }

    return canvas.toDataURL("image/png");
  };

  const getDiffuseBase64 = (flag, logoPre, logoCustom, text, callback, flag2 = "", flagCount = 1, textColor = "#ffffff") => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH; canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (text?.trim()) {
      let fontSize = 48;
      ctx.font = `bold ${fontSize}px Arial`; ctx.fillStyle = textColor || "#ffffff";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      while (ctx.measureText(text).width > CANVAS_WIDTH - 80 && fontSize > 28) { fontSize -= 2; ctx.font = `bold ${fontSize}px Arial`; }
      ctx.fillText(text, CANVAS_WIDTH / 2, TEXT_HEIGHT + FLAG_HEIGHT / 2);
    }
    const finalize = (logoOpacityBase64 = null) => callback(canvas.toDataURL("image/png"), logoOpacityBase64);
    const loadImage = (src) => new Promise((resolve, reject) => {
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => resolve(img); img.onerror = () => reject(); img.src = src;
    });

    // ---------- FLAG (unchanged) ----------
    if (flag && flagImages[flag]) {

      const drawFrame = () => {
        // white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, TEXT_HEIGHT, CANVAS_WIDTH - 20, FLAG_HEIGHT);

        // top black padding strip
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, TEXT_HEIGHT, CANVAS_WIDTH, 20);

        // border
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 40;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
      };

      const drawSingle = (img) => {
        drawFrame();

        const targetWidth = CANVAS_WIDTH * 0.9;
        const targetHeight = FLAG_HEIGHT * 0.85;

        const x = (CANVAS_WIDTH - targetWidth) / 2;
        const y = TEXT_HEIGHT + (FLAG_HEIGHT - targetHeight) / 2;

        ctx.drawImage(img, x, y, targetWidth, targetHeight);
      };

      const drawDouble = (img1, img2) => {
        drawFrame();

        const gap = 10;
        const flagH = FLAG_HEIGHT / 2;
        const flagW = (CANVAS_WIDTH - gap) / 2;
        const startX = (CANVAS_WIDTH - flagW) / 2;

        ctx.drawImage(img1, startX, TEXT_HEIGHT, flagW, flagH);
        ctx.drawImage(img2, startX, TEXT_HEIGHT + flagH + gap, flagW, flagH - gap);
      };

      if (flag2 && flagImages[flag2]) {
        Promise.all([
          loadImage(flagImages[flag]),
          loadImage(flagImages[flag2])
        ])
          .then(([img1, img2]) => {
            drawDouble(img1, img2);
            finalize();
          })
          .catch(finalize);

        return;
      }

      loadImage(flagImages[flag])
        .then((img) => {
          drawSingle(img);
          finalize();
        })
        .catch(finalize);

      return;
    }

    // ---------- LOGO (PORTED FROM FIRST / WORKING CODE) ----------
    let logoSrc = logoCustom;
    if (!logoSrc && logoPre) {
      const found = logos.find(l => l.name === logoPre);
      if (found?.file_path) logoSrc = `${BASE_URL}${found.file_path.replace(/\\/g, "/")}`;
    }
    if (logoSrc) {
      loadImage(logoSrc).then(img => {

        // ── Logo size ──
        const LOGO_W_SCALE = 0.8;
        const LOGO_H_SCALE = 1.1;
        const ratio = Math.min(CANVAS_WIDTH / img.width, FLAG_HEIGHT / img.height * 0.8);

        // Normal path dimensions
        const w = img.width * ratio * LOGO_W_SCALE;
        const h = img.height * ratio * LOGO_H_SCALE;
        const x = (CANVAS_WIDTH - w) / 2;
        const y = TEXT_HEIGHT + (FLAG_HEIGHT - h) / 20;

        // Two-tone path dimensions
        const TWOTONE_W_SCALE = 0.8;
        const TWOTONE_H_SCALE = 1.1; // 👈 yahan apni marzi ki value do
        const wTT = img.width * ratio * TWOTONE_W_SCALE;
        const hTT = img.height * ratio * TWOTONE_H_SCALE;
        const xTT = (CANVAS_WIDTH - wTT) / 2;
        const yTT = TEXT_HEIGHT + (FLAG_HEIGHT - hTT) / 20;

        const W = CANVAS_WIDTH, H = CANVAS_HEIGHT;

        // native pixels — alpha & two-tone detection
        const tmpC = document.createElement("canvas");
        tmpC.width = img.width; tmpC.height = img.height;
        const tmpCtx2 = tmpC.getContext("2d");
        tmpCtx2.drawImage(img, 0, 0);
        const tmpD = tmpCtx2.getImageData(0, 0, img.width, img.height);

        let imgHasAlpha = false;
        for (let i = 3; i < tmpD.data.length; i += 4) {
          if (tmpD.data[i] < 254) { imgHasAlpha = true; break; }
        }

        // near-black / near-white count (opaque pixels) — two-tone check
        let nBlack = 0, nWhite = 0, nOpaque = 0;
        for (let i = 0; i < tmpD.data.length; i += 4) {
          if (tmpD.data[i + 3] < 20) continue;
          nOpaque++;
          const lum = 0.299 * tmpD.data[i] + 0.587 * tmpD.data[i + 1] + 0.114 * tmpD.data[i + 2];
          if (lum < 50) nBlack++;
          else if (lum > 205) nWhite++;
        }
        const twoToneRatio = nOpaque ? (nBlack + nWhite) / nOpaque : 0;
        const isTwoTone = twoToneRatio > 0.9 && nBlack > 0 && nWhite > 0; // sirf B/W logos

        // background tone (corners average)
        const cLum = [[0, 0], [img.width - 1, 0], [0, img.height - 1], [img.width - 1, img.height - 1]]
          .map(([px, py]) => { const k = (py * img.width + px) * 4; return 0.299 * tmpD.data[k] + 0.587 * tmpD.data[k + 1] + 0.114 * tmpD.data[k + 2]; });
        const bgIsWhite = (cLum.reduce((s, v) => s + v, 0) / 4) > 127;

        if (isTwoTone) {
          // ── CLEAN PATH: white-bg+black-shape ya black-bg+white-shape ──
          const workC = document.createElement("canvas");
          workC.width = W; workC.height = H;
          const wctx = workC.getContext("2d");
          wctx.drawImage(img, xTT, yTT, wTT, hTT); // 👈 TT dimensions
          const wd = wctx.getImageData(0, 0, W, H);

          const shapeWhite = !bgIsWhite;      // bg black -> shape white
          const sc = shapeWhite ? 255 : 0;    // print color (solid)

          const opacityCanvas = document.createElement("canvas");
          opacityCanvas.width = W; opacityCanvas.height = H;
          const octx = opacityCanvas.getContext("2d");
          const od = octx.createImageData(W, H);

          for (let p = 0, i = 0; p < W * H; p++, i += 4) {
            const a = wd.data[i + 3];
            let fg;
            if (a < 20) fg = false;
            else {
              const lum = 0.299 * wd.data[i] + 0.587 * wd.data[i + 1] + 0.114 * wd.data[i + 2];
              fg = bgIsWhite ? (lum < 128) : (lum > 128); // crisp boundary = no outline
            }
            if (fg) {
              wd.data[i] = wd.data[i + 1] = wd.data[i + 2] = sc;
              wd.data[i + 3] = 255;
              od.data[i] = od.data[i + 1] = od.data[i + 2] = 255;
            } else {
              wd.data[i + 3] = 0;
              od.data[i] = od.data[i + 1] = od.data[i + 2] = 0;
            }
            od.data[i + 3] = 255;
          }
          wctx.putImageData(wd, 0, 0);   // offscreen canvas pe likho — safe
          octx.putImageData(od, 0, 0);

          // composite onto main ctx (background/text wipe nahi hoga)
          ctx.drawImage(workC, 0, 0);

          if (text?.trim()) {
            let fs = 48;
            ctx.font = `bold ${fs}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            while (ctx.measureText(text).width > CANVAS_WIDTH - 80 && fs > 28) { fs -= 2; ctx.font = `bold ${fs}px Arial`; }
            ctx.fillStyle = textColor;
            ctx.fillText(text, CANVAS_WIDTH / 2, TEXT_HEIGHT + FLAG_HEIGHT / 2);

            let fs2 = 48; octx.fillStyle = "#ffffff";
            octx.font = `bold ${fs2}px Arial`; octx.textAlign = "center"; octx.textBaseline = "middle";
            while (octx.measureText(text).width > CANVAS_WIDTH - 80 && fs2 > 28) { fs2 -= 2; octx.font = `bold ${fs2}px Arial`; }
            octx.fillText(text, CANVAS_WIDTH / 2, TEXT_HEIGHT + FLAG_HEIGHT / 2);
          }

          finalize(opacityCanvas.toDataURL("image/png"));
          return;
        }

        // ── GENERAL PATH (colored/normal logos — no white fill, no halo) ──
        ctx.drawImage(img, x, y, w, h);

        const opacityCanvas = document.createElement("canvas");
        opacityCanvas.width = CANVAS_WIDTH; opacityCanvas.height = CANVAS_HEIGHT;
        const octx = opacityCanvas.getContext("2d");
        if (imgHasAlpha) {
          octx.drawImage(img, x, y, w, h);
          const d = octx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          for (let i = 0; i < d.data.length; i += 4) {
            const bw = d.data[i + 3] > 127 ? 255 : 0;
            d.data[i] = d.data[i + 1] = d.data[i + 2] = bw; d.data[i + 3] = 255;
          }
          octx.putImageData(d, 0, 0);
        } else {
          const gC = (px, py) => { const idx = (py * img.width + px) * 4; return [tmpD.data[idx], tmpD.data[idx + 1], tmpD.data[idx + 2]]; };
          const corners = [gC(0, 0), gC(img.width - 1, 0), gC(0, img.height - 1), gC(img.width - 1, img.height - 1)];
          const bgR = corners.reduce((s, c) => s + c[0], 0) / 4;
          const bgG = corners.reduce((s, c) => s + c[1], 0) / 4;
          const bgB = corners.reduce((s, c) => s + c[2], 0) / 4;
          const thr = 90;
          octx.drawImage(img, x, y, w, h);
          const d = octx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          for (let i = 0; i < d.data.length; i += 4) {
            const a = d.data[i + 3]; let bw;
            if (a < 10) { bw = 0; }
            else { const diff = Math.abs(d.data[i] - bgR) + Math.abs(d.data[i + 1] - bgG) + Math.abs(d.data[i + 2] - bgB); bw = diff > thr ? 255 : 0; }
            d.data[i] = d.data[i + 1] = d.data[i + 2] = bw; d.data[i + 3] = 255;
          }
          octx.putImageData(d, 0, 0);
        }
        finalize(opacityCanvas.toDataURL("image/png"));
      }).catch(finalize);
      return;
    }

    finalize();
  };

  const handleFlagSelect = (field) => {
    setCurrentField(field);
    const area = field.replace("Flag", "").replace("LogoPredefined", "");
    postToPreview(`pant ${area}`);
    setShowFlagModal(true);
  };
  const selectFlag = (countryName) => { onUpdate({ pressureOptions: { ...pressureOptions, [currentField]: countryName } }); setShowFlagModal(false); };
  const selectLogo = (logoName, logoId) => { onUpdate({ pressureOptions: { ...pressureOptions, [currentField]: logoName, selectedLogoId: logoId } }); setShowFlagModal(false); };
  const clearField = (field) => { onUpdate({ pressureOptions: { ...pressureOptions, [field]: "" } }); };
  const getFlagDisplay = (n) => n || "";
  const getLogoDisplay = (n) => n || "";

  const handleTypeChange = (area, type) => {
    postToPreview(`pant ${area}`);
    onUpdate({
      pressureOptions: {
        ...pressureOptions,
        [`${area}Type`]: type, [`${area}Text`]: "",
        ...(type === "flag" ? { [`${area}LogoPredefined`]: "", [`${area}LogoCustom`]: "" }
          : type === "logo" ? { [`${area}Flag`]: "" }
            : { [`${area}Flag`]: "", [`${area}LogoPredefined`]: "", [`${area}LogoCustom`]: "" }),
      },
    });
  };

  useEffect(() => {
    if (logos && logos.length === 1) {
      const fields = ["rightLegLogoPredefined", "leftLegLogoPredefined"];
      if (!fields.some(f => pressureOptions[f])) {
        onUpdate({ pressureOptions: { ...pressureOptions, rightLegLogoPredefined: logos[0].name, selectedLogoId: logos[0].id } });
      }
    }
  }, [logos]);

  useEffect(() => {
    if (!data?.selectedColor) onUpdate({ selectedColor: "Heather Grey" });
  }, []);

  useEffect(() => {
    const colorMap = {
      "heather grey": "SweatPant:heatherGrey",
      black: "SweatPant:black",
      navy: "SweatPant:navy",
      white: "SweatPant:white",
    };
    const msg = colorMap[selectedColor.toLowerCase()];
    if (!msg) return;
    ["preview-iframe", "preview-iframe2"].forEach(id => { const f = document.getElementById(id); if (f?.contentWindow) f.contentWindow.postMessage(msg, "*"); });
  }, [selectedColor, isAppReady]);

  useEffect(() => {
    if (!selectedSize) return;
    const msg = `SweatPant:size:${selectedSize}`;
    ["preview-iframe", "preview-iframe2"].forEach(id => { const f = document.getElementById(id); if (f?.contentWindow) f.contentWindow.postMessage(msg, "*"); });
  }, [selectedSize, isAppReady]);

  const prevRef = React.useRef({});
  const renderCounterRef = React.useRef({});
  useEffect(() => {
    ["rightLeg", "leftLeg"].forEach(area => {
      const text = pressureOptions[`${area}Text`]?.trim() || "";
      const flag = pressureOptions[`${area}Flag`] || "";
      const flag2 = pressureOptions[`${area}Flag2`] || "";
      const flagCount = pressureOptions[`${area}FlagCount`] || 1;
      const logoPre = pressureOptions[`${area}LogoPredefined`] || "";
      const logoCustom = pressureOptions[`${area}LogoCustom`] || "";
      const type = pressureOptions[`${area}Type`] || "";
      const textColor = pressureOptions[`${area}TextColor`] || "#ffffff";
      const prev = prevRef.current[area] || {};
      if (prev.text === text && prev.flag === flag && prev.flag2 === flag2 && prev.flagCount === flagCount && prev.logoPre === logoPre && prev.logoCustom === logoCustom && prev.type === type && prev.textColor === textColor) return;
      prevRef.current[area] = { text, flag, flag2, flagCount, logoPre, logoCustom, type, textColor };
      const currentRender = (renderCounterRef.current[area] || 0) + 1;
      renderCounterRef.current[area] = currentRender;
      const hasFlag = !!flag && type === "flag";
      const hasLogo = !!(logoPre || logoCustom) && type === "logo";
      const opacity = getEmissiveBase64(text, hasFlag, hasLogo);
      ["preview-iframe", "preview-iframe2"].forEach(id => { const f = document.getElementById(id); if (f?.contentWindow) f.contentWindow.postMessage(`SweatPant:${area}_opacity: ${opacity}`, "*"); });
      getDiffuseBase64(flag, logoPre, logoCustom, text, (diffuse, logoOpacityBase) => {
        if (renderCounterRef.current[area] !== currentRender) return;
        ["preview-iframe", "preview-iframe2"].forEach(id => {
          const f = document.getElementById(id); if (f?.contentWindow) {
            f.contentWindow.postMessage(`SweatPant:${area}_diffuse: ${diffuse}`, "*");
            if (logoOpacityBase) f.contentWindow.postMessage(`SweatPant:${area}_opacity: ${logoOpacityBase}`, "*");
          }
        });
      }, flag2, flagCount, textColor);
    });
  }, [isAppReady, pressureOptions]);

  const colors = [
    { name: "Heather Grey", value: "#D4D9DC", border: "#D4D9DC" },
    { name: "Black", value: "#120F14", border: "#120F14" },
    { name: "Navy", value: "#051734", border: "#051734" },
    { name: "White", value: "#FFFFFF", border: "#D1D5DB" },
  ];
  const sizes = ["S", "M", "L", "XL", "2XL", "3XL"];

  const renderArea = (area) => (
    <div key={area} className="bg-white rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-gray-900 mb-3">
        {area === "rightLeg" ? "Right Leg:" : "Left Leg:"}
      </h3>
      <div className="space-y-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {["text", "flag", "logo"].map(tab => (
            <button key={tab} type="button"
              onClick={() => {
                if (tab === "text") onUpdate({ pressureOptions: { ...pressureOptions, [`${area}Type`]: "", [`${area}Flag`]: "", [`${area}LogoPredefined`]: "", [`${area}LogoCustom`]: "" } });
                else handleTypeChange(area, tab);
              }}
              className={`flex-1 py-2 text-xs font-bold capitalize transition-all ${pressureOptions[`${area}Type`] === tab || (tab === "text" && !pressureOptions[`${area}Type`]) ? "bg-green-700 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              {tab === "text" ? t("Text") : tab === "flag" ? t("Flag") : t("Logo")}
              {(tab === "text" && pressureOptions[`${area}Text`]) || (tab === "flag" && pressureOptions[`${area}Flag`]) || (tab === "logo" && pressureOptions[`${area}LogoPredefined`]) ? " ?" : ""}
            </button>
          ))}
        </div>
        {!pressureOptions[`${area}Type`] && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <input type="text" value={pressureOptions[`${area}Text`]}
                onChange={e => onUpdate({ pressureOptions: { ...pressureOptions, [`${area}Text`]: e.target.value } })}
                placeholder="Enter text" maxLength={maxCharsText}
                className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
              {pressureOptions[`${area}Text`] && <button onClick={() => clearField(`${area}Text`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
            </div>
            {pressureOptions[`${area}Text`] && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Text color:</span>
                {[{ val: "#ffffff", label: "White" }, { val: "#000000", label: "Black" }].map(({ val, label }) => (
                  <button key={val} type="button"
                    onClick={() => onUpdate({ pressureOptions: { ...pressureOptions, [`${area}TextColor`]: val } })}
                    title={label}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: val,
                      borderColor: (pressureOptions[`${area}TextColor`] || "#ffffff") === val ? "#16a34a" : val === "#ffffff" ? "#d1d5db" : "#374151",
                      boxShadow: (pressureOptions[`${area}TextColor`] || "#ffffff") === val ? "0 0 0 2px #16a34a" : "none",
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
            <input type="text" value={getFlagDisplay(pressureOptions[`${area}Flag`])} readOnly placeholder="Select flag"
              className="flex-1 min-w-[120px] px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer"
              onClick={() => handleFlagSelect(`${area}Flag`)}
            />
            <button onClick={() => handleFlagSelect(`${area}Flag`)} className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 text-sm font-medium">Select</button>
            {pressureOptions[`${area}Flag`] && <button onClick={() => clearField(`${area}Flag`)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
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
  );

  return (
    <div className="max-w-md mx-flex flex-col">
      {/* <div className="flex gap-2 p-4 pb-2">
        <button onClick={() => setActiveTab("size")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm ${activeTab === "size" ? "bg-white shadow-sm border-2 border-green-700" : "bg-white border-2 border-transparent hover:border-gray-300"}`}>
          <span className="font-medium text-gray-900">Color & Size</span>
          <img className="w-6" src={cog} alt="settings" />
        </button>
        <button onClick={() => setActiveTab("pressure")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm ${activeTab === "pressure" ? "bg-white shadow-sm border-2 border-green-700" : "bg-white border-2 border-transparent hover:border-gray-300"}`}>
          <span className="font-medium text-gray-900">Design</span>
          <img className="w-6" src={plus} alt="add" />
        </button>
      </div> */}

      {activeTab === "size" ? (
        <div className="flex flex-col flex-1 relative p-2">
          <h1 className="text-lg font-bold mb-4 text-gray-900">SweatPants</h1>
          <div className="mb-5">
            <h2 className="text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wide">Color</h2>
            <div className="grid grid-flow-col grid-rows-1 gap-2 w-fit">
              {colors.map(color => (
                <button key={color.name} title={color.name} onClick={() => onUpdate({ selectedColor: color.name })}
                  className="relative w-8 h-8 rounded-md transition-all focus:outline-none"
                  style={{ backgroundColor: color.value, border: selectedColor === color.name ? `2px solid ${color.border}` : `1px solid ${color.border}`, boxShadow: selectedColor === color.name ? `0 0 0 2px white, 0 0 0 3px ${color.border}` : "none" }}
                >
                  {selectedColor === color.name && <div className="absolute inset-0 rounded-md border border-white pointer-events-none" />}
                </button>
              ))}
            </div>
            {selectedColor && <p className="text-xs text-gray-500 mt-1.5">{selectedColor}</p>}
          </div>
          <div className="mb-5">
            <h2 className="text-xs font-semibold mb-2 text-gray-500 uppercase tracking-wide">Size</h2>
            <div className="flex flex-wrap gap-2">
              {sizes.map(size => (
                <button key={size} onClick={() => onUpdate({ selectedSize: size })}
                  className={`py-1.5 px-3 rounded-lg border-2 transition-all font-medium text-sm ${selectedSize === size ? "border-gray-900 bg-white text-gray-900" : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"}`}
                >{size}</button>
              ))}
            </div>
          </div>
          {/* <div className="absolute bottom-0 left-0 right-0 p-3 bg-gray-50 border-t border-gray-200">
            <button onClick={() => setActiveTab("pressure")} className="w-full py-2.5 bg-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 transition text-sm flex items-center justify-center gap-2">
              Next ? Design
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div> */}
        </div>
      ) : (
        <div className="flex flex-col flex-1 relative p-2">
          <h1 className="text-lg font-bold mb-4 text-gray-900">Design Options</h1>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Leg Area</h2>
            {["rightLeg", "leftLeg"].map(renderArea)}
          </div>
          {/* <div className="absolute bottom-0 left-0 right-0 p-3 bg-gray-50 border-t border-gray-200">
            <button onClick={() => setActiveTab("size")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
          </div> */}
        </div>
      )}

      {/* <div style={activeTab !== "pressure" ? { visibility: "hidden", position: "absolute", pointerEvents: "none", height: 0, overflow: "hidden" } : {}}>
        <Test1 postEx="SweatPant:" pressureOptions={pressureOptions} isAppReady={isAppReady}
          onUpdate={update => {
            if (update.canvasBase64) {
              const { diffuse, opacity, emissive } = update.canvasBase64;
              ["preview-iframe", "preview-iframe2"].forEach(id => {
                const f = document.getElementById(id);
                if (f?.contentWindow) { f.contentWindow.postMessage(diffuse, "*"); f.contentWindow.postMessage(opacity, "*"); if (emissive) f.contentWindow.postMessage(emissive, "*"); }
              });
            }
            if (update.backDesign !== undefined) onUpdate({ pressureOptions: { ...pressureOptions, backDesign: update.backDesign } });
          }}
        />
      </div> */}

      {showFlagModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowFlagModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="flex items-center justify-between px-8 py-7 border-b border-slate-50 bg-white/50 sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-2xl">
                  {currentField.includes("Logo") ? <ImageIcon className="w-6 h-6 text-green-600" /> : <Flag className="w-6 h-6 text-green-600" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-none">{currentField.includes("Logo") ? t("Select a Logo") : t("Choose a Flag")}</h2>
                  <p className="text-slate-500 text-sm mt-1.5 font-medium">{currentField.includes("Logo") ? t("Pick a symbol for your design") : t("Represent your country")}</p>
                </div>
              </div>
              <button onClick={() => setShowFlagModal(false)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all duration-200 group">
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto bg-slate-50/30">
              {currentField.includes("Logo") ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {logos && logos.map(logo => (
                    <button key={logo.id} onClick={() => selectLogo(logo.name, logo.id)}
                      className="group relative flex flex-col items-center p-2 rounded-3xl transition-all duration-300 hover:bg-white hover:shadow-xl"
                    >
                      <div className="w-full aspect-square mb-4 flex items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:border-green-200 group-hover:-translate-y-2 transition-all duration-500 p-5 overflow-hidden">
                        <img src={`${BASE_URL}${logo.file_path}`.replace(/\\/g, "/")} alt={logo.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-500 group-hover:text-green-700 truncate w-full px-2 text-center uppercase tracking-wider">{logo.name}</span>
                    </button>
                  ))}
                  {(!logos || logos.length === 0) && (
                    <div className="col-span-full py-20 text-center">
                      <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">{t("No logos found")}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {countries.map(country => (
                    <button key={country.name} onClick={() => selectFlag(country.name)}
                      className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-white border border-slate-100 hover:border-green-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden shadow-sm bg-slate-100">
                        <img src={country.flag} alt={country.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 uppercase tracking-wider text-center">{country.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-8 py-5 border-t border-slate-50 bg-white flex justify-center items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t("Choose an asset to customize your placement")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SweatPants;