import { useRef, useState, useEffect } from "react";
import deleteIconImg from '../assets/canvasimage/delete.png';
import lockIconImg from '../assets/canvasimage/locked.png';
import unlockIconImg from '../assets/canvasimage/unlocked.png';
import resizeIconImg from '../assets/canvasimage/resize.png';
import rotateIconImg from '../assets/canvasimage/rotate.png';

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
const CANVAS_HEIGHT = 500;

export default function Test1({ pressureOptions, onUpdate, postEx, isAppReady }) {
  const canvasRef = useRef(null);
  const [objects, setObjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [offset, setOffset] = useState({});
  const [initialSize, setInitialSize] = useState({ w: 0, h: 0 });
  const [initialAngleOffset, setInitialAngleOffset] = useState(0);

  const flagImages = {
    'Denmark': 'https://flagcdn.com/w80/dk.png',
    'United States': 'https://flagcdn.com/w80/us.png',
    // ... add more if needed, but these are for legs
  };

  const draw = (includeHandles = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    objects.forEach(obj => {
      ctx.save();
      ctx.translate(obj.pos.x, obj.pos.y);
      ctx.rotate(obj.angle * Math.PI / 180);
      if ((obj.type === 'image' || obj.type === 'flag') && obj.srcObj?.complete) {
        ctx.drawImage(obj.srcObj, -obj.size.w / 2, -obj.size.h / 2, obj.size.w, obj.size.h);
      } else if (obj.type === 'text') {
        ctx.font = `bold ${obj.fontSize}px Arial`;
        ctx.fillStyle = '#111111'; // dark color for legs if needed
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.text, 0, 0);
      }
      ctx.restore();
    });

    if (includeHandles) {
      const selected = objects.find(o => o.id === selectedId);
      if (selected) {
        const handles = {
          tl: { cx: -1, cy: -1, icon: deleteIcon },
          tr: { cx: 1, cy: -1, icon: selected.locked ? lockIcon : unlockIcon },
          br: { cx: 1, cy: 1, icon: resizeIcon },
          bl: { cx: -1, cy: 1, icon: rotateIcon },
        };
        Object.entries(handles).forEach(([key, h]) => {
          const corner = getCornerPos(selected, h.cx, h.cy);
          ctx.save();
          ctx.translate(corner.x, corner.y);
          ctx.rotate(selected.angle * Math.PI / 180);
          if (selected.locked && key !== 'tr') ctx.globalAlpha = 0.4;
          ctx.drawImage(h.icon, -HANDLE_SIZE / 2, -HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
          ctx.restore();
        });
      }
    }
    return canvas.toDataURL("image/png");
  };

  const getCornerPos = (obj, cx, cy) => {
    const rad = obj.angle * Math.PI / 180;
    const rx = (cx * obj.size.w / 2) * Math.cos(rad) - (cy * obj.size.h / 2) * Math.sin(rad);
    const ry = (cx * obj.size.w / 2) * Math.sin(rad) + (cy * obj.size.h / 2) * Math.cos(rad);
    return { x: obj.pos.x + rx, y: obj.pos.y + ry };
  };

  const isOnHandle = (mx, my, obj, cx, cy) => {
    const corner = getCornerPos(obj, cx, cy);
    const dx = mx - corner.x;
    const dy = my - corner.y;
    return dx * dx + dy * dy <= (HANDLE_SIZE / 2) ** 2;
  };

  useEffect(() => {
    requestAnimationFrame(() => draw(true));
  }, [objects, selectedId, dragging, resizing, rotating, isAppReady]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const cleanBase64 = draw(false);
      const prefixed = (postEx || '') + "leg_custom: " + cleanBase64;
      onUpdate?.({ canvasBase64: prefixed });
    });
  }, [objects, isAppReady]);

  // Interaction handlers (mousedown, mousemove, mouseup)
  const onMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let hit = false;
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (isOnHandle(x, y, obj, 1, -1)) {
        setObjects(prev => prev.map(o => o.id === obj.id ? { ...o, locked: !o.locked } : o));
        setSelectedId(obj.id);
        hit = true; break;
      }
      if (obj.locked) continue;
      if (isOnHandle(x, y, obj, 1, 1)) {
        setSelectedId(obj.id); setResizing(true); setInitialSize(obj.size);
        const rad = -obj.angle * Math.PI / 180;
        const dx = x - obj.pos.x, dy = y - obj.pos.y;
        const lx = dx * Math.cos(rad) - dy * Math.sin(rad), ly = dx * Math.sin(rad) + dy * Math.cos(rad);
        setOffset({ dist: Math.hypot(lx, ly) });
        hit = true; break;
      }
      if (isOnHandle(x, y, obj, -1, 1)) {
        setSelectedId(obj.id); setRotating(true);
        const mouseAngle = Math.atan2(y - obj.pos.y, x - obj.pos.x);
        setInitialAngleOffset(mouseAngle - obj.angle * Math.PI / 180);
        hit = true; break;
      }
      const rad = -obj.angle * Math.PI / 180;
      const dx = x - obj.pos.x, dy = y - obj.pos.y;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad), ly = dx * Math.sin(rad) + dy * Math.cos(rad);
      if (Math.abs(lx) <= obj.size.w / 2 && Math.abs(ly) <= obj.size.h / 2) {
        setSelectedId(obj.id); setDragging(true); setOffset({ x: dx, y: dy });
        hit = true; break;
      }
    }
    if (!hit) setSelectedId(null);
  };

  const onMouseMove = (e) => {
    if (!selectedId) return;
    const selected = objects.find(o => o.id === selectedId);
    if (!selected || selected.locked) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (dragging) {
      setObjects(prev => prev.map(o => o.id === selectedId ? { ...o, pos: { x: x - offset.x, y: y - offset.y } } : o));
    }
    if (resizing) {
      const rad = -selected.angle * Math.PI / 180;
      const dx = x - selected.pos.x, dy = y - selected.pos.y;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad), ly = dx * Math.sin(rad) + dy * Math.cos(rad);
      if (lx < 0 || ly < 0) return;
      const scale = Math.hypot(lx, ly) / offset.dist;
      setObjects(prev => prev.map(o => o.id === selectedId ? { ...o, size: { w: initialSize.w * scale, h: initialSize.h * scale } } : o));
    }
    if (rotating) {
      const mouseAngle = Math.atan2(y - selected.pos.y, x - selected.pos.x);
      setObjects(prev => prev.map(o => o.id === selectedId ? { ...o, angle: (mouseAngle - initialAngleOffset) * 180 / Math.PI } : o));
    }
  };

  const onMouseUp = () => { setDragging(false); setResizing(false); setRotating(false); };

  return (
    <div className="p-0 max-w-2xl mx-auto">
      {/* <canvas
        ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
        className="border-2 border-gray-300 rounded-lg shadow-lg block mx-auto bg-gray-50"
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        style={{ cursor: objects.find(o => o.id === selectedId)?.locked ? "not-allowed" : "move" }}
      /> */}
    </div>
  );
}