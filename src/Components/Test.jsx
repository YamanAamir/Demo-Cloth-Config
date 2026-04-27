import { useRef, useState, useEffect } from "react";
import deleteIconImg from '../assets/canvasimage/delete.png';
import lockIconImg from '../assets/canvasimage/locked.png';
import unlockIconImg from '../assets/canvasimage/unlocked.png';
import resizeIconImg from '../assets/canvasimage/resize.png';
import rotateIconImg from '../assets/canvasimage/rotate.png';

// Predefined back designs
import design1 from '../assets/predefinedbackimages/Design1.jpeg';
import design2 from '../assets/predefinedbackimages/Design2.jpeg';
import design3 from '../assets/predefinedbackimages/Design3.jpeg';
import design4 from '../assets/predefinedbackimages/Design4.jpeg';
import design5 from '../assets/predefinedbackimages/Design5.jpeg';
import design6 from '../assets/predefinedbackimages/Design6.jpeg';
import design7 from '../assets/predefinedbackimages/Design7.jpeg';
import design8 from '../assets/predefinedbackimages/Design8.jpeg';
import { BASE_URL } from "../utils/const";
import useLogoStore from "../store/logoStore";
import useBackDesignStore from "../store/backDesignStore";

// Preload icons
const deleteIcon = new Image();
deleteIcon.src = deleteIconImg;
const lockIcon = new Image();
lockIcon.src = lockIconImg;
const unlockIcon = new Image();
unlockIcon.src = unlockIconImg;
const resizeIcon = new Image();
resizeIcon.src = resizeIconImg;
const rotateIcon = new Image();
rotateIcon.src = rotateIconImg;

const HANDLE_SIZE = 28;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;

// const logos = [
//   { name: 'Design 1', url: design1 },
//   { name: 'Design 2', url: design2 },
//   { name: 'Design 3', url: design3 },
//   { name: 'Design 4', url: design4 },
//   { name: 'Design 5', url: design5 },
//   { name: 'Design 6', url: design6 },
//   { name: 'Design 7', url: design7 },
//   { name: 'Design 8', url: design8 },
// ];

export default function Test({ pressureOptions, onUpdate, postEx, isAppReady, designColor }) {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [offset, setOffset] = useState({});
  const [initialSize, setInitialSize] = useState({ w: 0, h: 0 });
  const [initialAngleOffset, setInitialAngleOffset] = useState(0);

  const { backDesigns, loading, fetchBackDesigns } = useBackDesignStore();
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const getClassId = user?.class_id;

  // Keep designColor in ref so draw() always gets latest value (avoids stale closure)
  // Priority: prop > backDesigns store value
  const designColorRef = useRef(designColor);
  useEffect(() => {
    designColorRef.current = designColor || backDesigns?.designColor;
  }, [designColor, backDesigns]);


  useEffect(() => {
    if (getClassId) {
      console.log("🔍 Fetching back designs for class:", getClassId);
      fetchBackDesigns({ class_id: getClassId });
    }
  }, [getClassId]);

  console.log("🎨 Current backDesigns:", backDesigns);
  console.log("🎨 Current pressureOptions.backDesign:", pressureOptions?.backDesign);
  console.log("🎨 Current objects.length:", objects.length);

  // Helper: load image via blob URL to avoid canvas taint from CORS
  const loadImageSafe = (src, callback) => {
    fetch(src)
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          callback(img);
          URL.revokeObjectURL(blobUrl);
        };
        img.onerror = () => {
          // fallback: try direct load without crossOrigin
          const img2 = new Image();
          img2.onload = () => callback(img2);
          img2.src = src;
        };
        img.src = blobUrl;
      })
      .catch(() => {
        // fallback: direct load
        const img = new Image();
        img.onload = () => callback(img);
        img.src = src;
      });
  };

  // Load saved backDesign when pressureOptions change
  useEffect(() => {
    if (pressureOptions?.backDesign) {
      const config = pressureOptions.backDesign;
      loadImageSafe(config.src, (img) => {
        setObjects([{
          id: 'uploadedImage',
          type: 'image',
          srcObj: img,
          pos: config.pos,
          size: config.size,
          angle: config.angle,
          locked: config.locked,
        }]);
        setSelectedId('uploadedImage');
      });
    } else {
      setObjects([]);
      setSelectedId(null);
    }
  }, [pressureOptions]);
 const selectPredefinedDesign = async (url, design) => {
    loadImageSafe(url, async (img) => {
      const scale = Math.min(
        (CANVAS_WIDTH * 0.75) / img.width,
        (CANVAS_HEIGHT * 0.65) / img.height
      );
      const w = img.width * scale;
      const h = img.height * scale;

      const newImageObj = {
        id: 'uploadedImage',
        type: 'image',
        srcObj: img,
        pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
        size: { w, h },
        angle: 0,
        locked: false,
      };

      setObjects([newImageObj]);
      setSelectedId('uploadedImage');

      onUpdate({
        backDesign: {
          pos: newImageObj.pos,
          size: newImageObj.size,
          angle: newImageObj.angle,
          locked: newImageObj.locked,
          src: url,
          designId: design?.id
        }
      });
    });
  };
  // Separate effect to handle when backDesigns becomes available after initial mount
  useEffect(() => {
    console.log("🔄 BackDesigns availability changed:", {
      backDesigns: backDesigns,
      hasBackDesigns: !!backDesigns,
      currentObjectsLength: objects.length,
      currentPressureBackDesign: pressureOptions?.backDesign
    });
    
    // If backDesigns just became available and we don't have any objects yet
    if (backDesigns && objects.length === 0 && !pressureOptions?.backDesign) {
      const design = backDesigns;

      if (design.file_path) {
        const img = `${BASE_URL}${design.file_path.replace(/\\/g, "/")}`;
        loadImageSafe(img, async (imgObj) => {
          const scale = Math.min(
            (CANVAS_WIDTH * 0.75) / imgObj.width,
            (CANVAS_HEIGHT * 0.65) / imgObj.height
          );
          const w = imgObj.width * scale;
          const h = imgObj.height * scale;

          const newImageObj = {
            id: 'uploadedImage',
            type: 'image',
            srcObj: imgObj,
            pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
            size: { w, h },
            angle: 0,
            locked: false,
          };

          setObjects([newImageObj]);
          setSelectedId('uploadedImage');

          onUpdate({
            backDesign: {
              pos: newImageObj.pos,
              size: newImageObj.size,
              angle: newImageObj.angle,
              locked: newImageObj.locked,
              src: img,
              designId: design?.id
            }
          });
        });
      }
    }
  }, [backDesigns]); // Only watch backDesigns changes

  const getSelected = () => objects.find(o => o.id === selectedId);

  const getCornerPos = (obj, cx, cy) => {
    const rad = (obj.angle * Math.PI) / 180;
    const localX = (cx * obj.size.w) / 2;
    const localY = (cy * obj.size.h) / 2;
    const rx = localX * Math.cos(rad) - localY * Math.sin(rad);
    const ry = localX * Math.sin(rad) + localY * Math.cos(rad);
    return { x: obj.pos.x + rx, y: obj.pos.y + ry };
  };

  const isOnHandle = (mx, my, obj, cx, cy) => {
    const corner = getCornerPos(obj, cx, cy);
    const dx = mx - corner.x;
    const dy = my - corner.y;
    return dx * dx + dy * dy <= (HANDLE_SIZE / 2) ** 2;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all objects on main canvas (for diffuse)
    objects.forEach(obj => {
      ctx.save();
      ctx.translate(obj.pos.x, obj.pos.y);
      ctx.rotate((obj.angle * Math.PI) / 180);
      if (obj.type === 'image') {
        ctx.drawImage(obj.srcObj, -obj.size.w / 2, -obj.size.h / 2, obj.size.w, obj.size.h);
      } else if (obj.type === 'text') {
        ctx.font = `bold ${obj.fontSize}px ${obj.fontFamily || 'Arial'}`;
        ctx.fillStyle = obj.color || '#111111';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.text, 0, 0);
      }
      ctx.restore();
    });

    // ── Opacity Mask (pure black/white: bright bg → black, dark design → white) ──
    const opacityCanvas = document.createElement("canvas");
    opacityCanvas.width = CANVAS_WIDTH;
    opacityCanvas.height = CANVAS_HEIGHT;
    const octx = opacityCanvas.getContext("2d");
    // No background fill — transparent canvas, empty areas = black (no print)
    objects.forEach(obj => {
      octx.save();
      octx.translate(obj.pos.x, obj.pos.y);
      octx.rotate((obj.angle * Math.PI) / 180);
      if (obj.type === 'image') {
        octx.drawImage(obj.srcObj, -obj.size.w / 2, -obj.size.h / 2, obj.size.w, obj.size.h);
      } else if (obj.type === 'text') {
        octx.font = `bold ${obj.fontSize}px ${obj.fontFamily || 'Arial'}`;
        octx.fillStyle = obj.color || '#111111';
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.fillText(obj.text, 0, 0);
      }
      octx.restore();
    });
    const imgData = octx.getImageData(0, 0, opacityCanvas.width, opacityCanvas.height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const brightness = 0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2];
      const alpha = imgData.data[i + 3];
      // Transparent pixels (empty canvas) → black, bright pixels (white bg) → black, dark pixels (design) → white
      const bw = (alpha < 10 || brightness > 128) ? 0 : 255;
      imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = bw;
      imgData.data[i + 3] = 255;
    }
    octx.putImageData(imgData, 0, 0);

    let diffuseBase64 = "";
    let opacityBase64 = "";

    try {
      diffuseBase64 = canvas.toDataURL("image/png");
      opacityBase64 = opacityCanvas.toDataURL("image/png");
    } catch (err) {
      console.warn("Canvas blocked due to CORS:", err);
      // If blocked, we still want to try to draw handles but onUpdate might fail
    }

    // Send to parent / PlayCanvas
    if (onUpdate && postEx && diffuseBase64 && opacityBase64) {
      onUpdate({
        canvasBase64: {
          diffuse: postEx + "back_diffuse: " + diffuseBase64,
          opacity: postEx + "back_opacity: " + opacityBase64,
          emissive: postEx + "back_emissive: " + diffuseBase64,
          // Special field for PlayCanvas to avoid CORS:
          rawData: {
            diffuse: diffuseBase64,
            opacity: opacityBase64,
            emissive: diffuseBase64,
            slot: 'back'
          }
        }
      });
    }

    // Draw handles for selected object
    const selected = getSelected();
    if (selected) {
      const handles = {
        tl: { cx: -1, cy: -1, icon: deleteIcon },
        tr: { cx: 1, cy: -1, icon: selected.locked ? lockIcon : unlockIcon },
        br: { cx: 1, cy: 1, icon: resizeIcon },
        bl: { cx: -1, cy: 1, icon: rotateIcon },
      };

      for (const key in handles) {
        const h = handles[key];
        const corner = getCornerPos(selected, h.cx, h.cy);
        ctx.save();
        ctx.translate(corner.x, corner.y);
        ctx.rotate((selected.angle * Math.PI) / 180);

        if (selected.locked && key !== 'tr') {
          ctx.globalAlpha = 0.4;
        }

        ctx.drawImage(h.icon, -HANDLE_SIZE / 2, -HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        ctx.restore();
      }
    }
  };

  useEffect(() => draw(), [objects, selectedId, isAppReady]);

  // const selectPredefinedDesign = (url) => {
  //   const img = new Image();
  //   img.crossOrigin = "anonymous";
  //   img.onload = () => {
  //     const scale = Math.min(
  //       (CANVAS_WIDTH * 0.75) / img.width,
  //       (CANVAS_HEIGHT * 0.65) / img.height
  //     );
  //     const w = img.width * scale;
  //     const h = img.height * scale;

  //     const newImageObj = {
  //       id: 'uploadedImage',
  //       type: 'image',
  //       srcObj: img,
  //       pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
  //       size: { w, h },
  //       angle: 0,
  //       locked: false,
  //     };

  //     setObjects([newImageObj]);
  //     setSelectedId('uploadedImage');

  //     onUpdate({
  //       backDesign: {
  //         pos: newImageObj.pos,
  //         size: newImageObj.size,
  //         angle: newImageObj.angle,
  //         locked: newImageObj.locked,
  //         src: url,
  //       }
  //     });
  //   };
  //   img.src = url;
  // };

 
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(
          (CANVAS_WIDTH * 0.75) / img.width,
          (CANVAS_HEIGHT * 0.65) / img.height
        );
        const w = img.width * scale;
        const h = img.height * scale;

        const newImageObj = {
          id: 'uploadedImage',
          type: 'image',
          srcObj: img,
          pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
          size: { w, h },
          angle: 0,
          locked: false,
        };

        setObjects([newImageObj]);
        setSelectedId('uploadedImage');

        onUpdate({
          backDesign: {
            pos: newImageObj.pos,
            size: newImageObj.size,
            angle: newImageObj.angle,
            locked: newImageObj.locked,
            src: ev.target.result,
          }
        });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const deleteObject = (obj) => {
    if (obj.id === 'uploadedImage') {
      onUpdate({ backDesign: null });
    }
    setObjects(prev => prev.filter(o => o.id !== obj.id));
    setSelectedId(null);
  };

  const onMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let clickedOnObject = false;

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];

      if (isOnHandle(x, y, obj, 1, -1)) {
        const newLocked = !obj.locked;
        setObjects(prev => prev.map(o => o.id === obj.id ? { ...o, locked: newLocked } : o));
        onUpdate({
          backDesign: {
            pos: obj.pos,
            size: obj.size,
            angle: obj.angle,
            locked: newLocked,
            src: obj.srcObj.src
          }
        });
        setSelectedId(obj.id);
        clickedOnObject = true;
        draw();
        return;
      }

      if (obj.locked) continue;

      if (isOnHandle(x, y, obj, -1, -1)) {
        deleteObject(obj);
        clickedOnObject = true;
        return;
      }

      if (isOnHandle(x, y, obj, 1, 1)) {
        setSelectedId(obj.id);
        setResizing(true);
        setInitialSize(obj.size);
        const rad = -obj.angle * Math.PI / 180;
        const dx = x - obj.pos.x;
        const dy = y - obj.pos.y;
        const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
        setOffset({ dist: Math.hypot(lx, ly) });
        clickedOnObject = true;
        return;
      }

      if (isOnHandle(x, y, obj, -1, 1)) {
        setSelectedId(obj.id);
        setRotating(true);
        const mouseAngle = Math.atan2(y - obj.pos.y, x - obj.pos.x);
        setInitialAngleOffset(mouseAngle - obj.angle * Math.PI / 180);
        clickedOnObject = true;
        return;
      }

      const rad = -obj.angle * Math.PI / 180;
      const dx = x - obj.pos.x;
      const dy = y - obj.pos.y;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = dx * Math.sin(rad) + dy * Math.cos(rad);

      if (Math.abs(lx) <= obj.size.w / 2 && Math.abs(ly) <= obj.size.h / 2) {
        setSelectedId(obj.id);
        setDragging(true);
        setOffset({ x: dx, y: dy });
        clickedOnObject = true;
        return;
      }
    }

    if (!clickedOnObject) {
      setSelectedId(null);
    }
  };

  const onMouseMove = (e) => {
    if (!selectedId) return;
    const selected = getSelected();
    if (!selected || selected.locked) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragging) {
      let newX = x - offset.x;
      let newY = y - offset.y;
      const r = Math.hypot(selected.size.w / 2, selected.size.h / 2);
      newX = Math.max(r, Math.min(CANVAS_WIDTH - r, newX));
      newY = Math.max(r, Math.min(CANVAS_HEIGHT - r, newY));
      setObjects(objs => objs.map(o => o.id === selectedId ? { ...o, pos: { x: newX, y: newY } } : o));
    }

    if (resizing) {
      const rad = -selected.angle * Math.PI / 180;
      const dx = x - selected.pos.x;
      const dy = y - selected.pos.y;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
      if (lx < 0 || ly < 0) return;

      const scale = Math.hypot(lx, ly) / offset.dist;
      let newW = initialSize.w * scale;
      let newH = initialSize.h * scale;

      const maxR = Math.min(selected.pos.x, CANVAS_WIDTH - selected.pos.x, selected.pos.y, CANVAS_HEIGHT - selected.pos.y);
      const propR = Math.hypot(newW / 2, newH / 2);
      if (propR > maxR) {
        newW *= maxR / propR;
        newH *= maxR / propR;
      }

      newW = Math.max(30, newW);
      newH = Math.max(30, newH);

      setObjects(objs => objs.map(o => o.id === selectedId ? { ...o, size: { w: newW, h: newH } } : o));
    }

    if (rotating) {
      const mouseAngle = Math.atan2(y - selected.pos.y, x - selected.pos.x);
      const newAngle = (mouseAngle - initialAngleOffset) * 180 / Math.PI;
      setObjects(objs => objs.map(o => o.id === selectedId ? { ...o, angle: newAngle } : o));
    }
  };

  const onMouseUp = () => {
    if (dragging || resizing || rotating) {
      const selected = getSelected();
      if (selected) {
        onUpdate({
          backDesign: {
            pos: selected.pos,
            size: selected.size,
            angle: selected.angle,
            locked: selected.locked,
            src: selected.srcObj.src
          }
        });
      }
    }
    setDragging(false);
    setResizing(false);
    setRotating(false);
  };
  console.log("backDesigns", backDesigns);
  console.log("canvasRefasasa", canvasRef);

  return (
    <div className="p-0 max-w-2xl mx-auto">
      {/* Show message when design is auto-applied */}
      {backDesigns && objects.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            ✓ Back design "{backDesigns.name}" has been automatically applied to all students.
          </p>
        </div>
      )}

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-gray-300 rounded-lg shadow-lg block mx-auto bg-gray-50"
        style={{ cursor: getSelected()?.locked ? "not-allowed" : "move" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
    </div>
  );
}