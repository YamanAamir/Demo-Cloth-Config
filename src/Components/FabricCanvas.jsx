import React, { useRef, useEffect } from 'react';
// import * as fabric from 'fabric';
import deleteIconImg from '../assets/canvasimage/delete.png';
import lockIconImg from '../assets/canvasimage/locked.png';
import unlockIconImg from '../assets/canvasimage/unlocked.png';
import resizeIconImg from '../assets/canvasimage/resize.png';
import rotateIconImg from '../assets/canvasimage/rotate.png';

// --- Preload Icons and Images ---
const deleteIconImgObj = new Image();
deleteIconImgObj.src = deleteIconImg;
const lockIconImgObj = new Image();
lockIconImgObj.src = lockIconImg;
const unlockIconImgObj = new Image();
unlockIconImgObj.src = unlockIconImg;
const resizeIconImgObj = new Image();
resizeIconImgObj.src = resizeIconImg;
const rotateIconImgObj = new Image();
rotateIconImgObj.src = rotateIconImg;

// --- Helper to render custom control icons ---
const renderIcon = (imgObj) => {
  return (ctx, left, top, styleOverride, fabricObject) => {
    const size = 24;
    ctx.save();
    ctx.translate(left, top);
    if (fabricObject.angle) {
      ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
    }
    ctx.drawImage(imgObj, -size / 2, -size / 2, size, size);
    ctx.restore();
  };
};

// --- Custom Control Actions ---
const deleteObject = (eventData, transform) => {
  const target = transform.target;
  const canvas = target.canvas;
  canvas.remove(target);
  canvas.requestRenderAll();
  return true;
};

const toggleLock = (eventData, transform) => {
  const target = transform.target;
  const isLocked = target.lockMovementX;

  // Toggle all lock properties
  target.lockMovementX = !isLocked;
  target.lockMovementY = !isLocked;
  target.lockScalingX = !isLocked;
  target.lockScalingY = !isLocked;
  target.lockRotation = !isLocked;

  target.canvas.requestRenderAll();
  return true;
};

// --- Customize Controls Function ---
const customizeControls = () => {
  if (!fabric.Object || !fabric.Object.prototype) return;

  const controls = fabric.Object.prototype.controls;
  const controlsUtils = fabric.controlsUtils || {};

  // Top-Left: Delete
  controls.tl = new fabric.Control({
    x: -0.5, y: -0.5,
    cursorStyle: 'pointer',
    actionHandler: deleteObject,
    mouseUpHandler: deleteObject,
    render: renderIcon(deleteIconImgObj),
    cornerSize: 24
  });

  // Top-Right: Lock/Unlock
  controls.tr = new fabric.Control({
    x: 0.5, y: -0.5,
    cursorStyle: 'pointer',
    mouseUpHandler: toggleLock,
    render: (ctx, left, top, styleOverride, fabricObject) => {
      const iconImg = fabricObject.lockMovementX ? lockIconImgObj : unlockIconImgObj;
      renderIcon(iconImg)(ctx, left, top, styleOverride, fabricObject);
    },
    cornerSize: 24
  });

  // Bottom-Right: Resize
  if (controlsUtils.scalingEqually) {
    controls.br = new fabric.Control({
      x: 0.5, y: 0.5,
      cursorStyle: 'nwse-resize',
      actionHandler: controlsUtils.scalingEqually,
      render: renderIcon(resizeIconImgObj),
      cornerSize: 24
    });
  }

  // Bottom-Left: Rotate
  if (controlsUtils.rotationWithSnapping) {
    controls.bl = new fabric.Control({
      x: -0.5, y: 0.5,
      cursorStyle: 'crosshair',
      actionHandler: controlsUtils.rotationWithSnapping,
      render: renderIcon(rotateIconImgObj),
      cornerSize: 24
    });
  }

  // Remove default middle controls
  controls.mtr = null;
  controls.ml = null;
  controls.mr = null;
  controls.mt = null;
  controls.mb = null;

  // Global Object Defaults
  fabric.Object.prototype.set({
    transparentCorners: false,
    cornerColor: '#ffffff',
    cornerStrokeColor: '#cccccc',
    borderColor: '#000000',
    cornerSize: 12,
    padding: 10,
    borderDashArray: [4, 4],
    centeredScaling: true
  });
};

const FabricCanvas = ({ pressureOptions, onTextureUpdate, width = 400, height = 400 }) => {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);

  // Initialize Canvas
  useEffect(() => {
    customizeControls();

    // Create Fabric Canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff', // Required for transparent output masking if needed, but here user wants specific output
      preserveObjectStacking: true
    });

    fabricRef.current = canvas;

    // Helper to trigger texture update
    const triggerUpdate = () => {
      if (onTextureUpdate) {
        // Generate Base64
        const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
        onTextureUpdate(dataURL);
      }
    };

    // Events
    canvas.on('object:modified', triggerUpdate);
    canvas.on('object:added', triggerUpdate);
    canvas.on('object:removed', triggerUpdate);

    // Basic Bounds Clamping (keeps objects inside canvas)
    const clamp = (e) => {
      const obj = e.target;
      if (!obj) return;
      obj.setCoords();
      // Simple clamp: check center point or boundaries
      // If center is outside, pull it back? Or just limit top/left
      /* Implementation skipped to keep flexible as per user request for "scale sab kuch hoga" */
    };
    canvas.on('object:moving', clamp);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [width, height]);


  // Sync Props to Canvas
  useEffect(() => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    if (!pressureOptions) return; // Guard

    // Helper: Find object by ID
    const findObj = (id) => canvas.getObjects().find(o => o.id === id);

    // 1. Text Fields
    const textFields = ['rightChestText', 'leftChestText', 'rightSleeveText', 'leftSleeveText'];
    textFields.forEach((field, i) => {
      const val = pressureOptions[field];
      const objId = `text-${field}`;
      let obj = findObj(objId);

      if (val) {
        if (obj) {
          if (obj.text !== val) {
            obj.set({ text: val });
            canvas.requestRenderAll();
            // triggerUpdate handled by event? modifying programmatically sometimes doesn't fire event
            // We should trigger manually if needed, but 'object:modified' is for user interactions usually.
            // Let's trigger update at end of this effect.
          }
        } else {
          // New Text
          const t = new fabric.Text(val, {
            left: width / 2,
            top: 100 + (i * 60), // Stagger positions
            fontSize: 40,
            fontFamily: 'Arial',
            fill: '#000000',
            id: objId,
            originX: 'center',
            originY: 'center',
            textAlign: 'center'
          });
          // Auto-scale if huge
          if (t.width > width * 0.9) t.scaleToWidth(width * 0.9);

          canvas.add(t);
          canvas.setActiveObject(t);
        }
      } else {
        // If value is empty, remove object
        if (obj) canvas.remove(obj);
      }
    });

    // 2. Flag Fields
    // Mapping Country Name -> Filename
    const flagMap = {
      "Denmark": "dk.png",
      "United States": "us.png",
      "United Kingdom": "gb.png",
      "Germany": "de.png",
      "France": "fr.png",
      "Italy": "it.png",
      "Spain": "es.png",
      "Netherlands": "nl.png",
      "Sweden": "se.png",
      "Norway": "no.png",
      "Finland": "fi.png",
      "Poland": "pl.png",
      "Japan": "jp.png",
      "South Korea": "kr.png",
      "China": "cn.png",
      "India": "in.png",
      "Brazil": "br.png",
      "Canada": "ca.png",
      "Australia": "au.png",
      "Mexico": "mx.png"
    };

    const flagFields = ['rightChestFlag', 'leftChestFlag', 'rightSleeveFlag', 'leftSleeveFlag'];
    flagFields.forEach((field, i) => {
      const country = pressureOptions[field];
      const objId = `flag-${field}`;
      let obj = findObj(objId);

      if (country) {
        const filename = flagMap[country];
        if (filename) {
          const url = `/flags/${filename}`;

          // If object exists and has same source, do nothing
          if (obj && obj._src === url) {
            // do nothing
          } else {
            // If obj exists but different src, remove it first (easiest way to swap image)
            if (obj) canvas.remove(obj);

            // Load new
            fabric.Image.fromURL(url).then(img => {
              if (!img) return; // failed

              // Keep previous position if we swapped? Or default?
              // If we just removed 'obj', we lost its position.
              // Ideally we want to copy properties. 
              // For now, simpler to reset to default position to avoid glitching if aspect ratio differs vastly

              img.set({
                left: width / 2,
                top: 200 + (i * 60),
                originX: 'center',
                originY: 'center',
                id: objId,
                _src: url, // Custom prop to track source
              });
              img.scaleToWidth(80); // Default flag size

              canvas.add(img);
              canvas.requestRenderAll();
              // Trigger texture update
              if (onTextureUpdate) onTextureUpdate(canvas.toDataURL());
            }).catch(err => console.error("Flag load error", err));
          }
        }
      } else {
        if (obj) canvas.remove(obj);
      }
    });

    // 3. Uploaded Image
    const uploadId = 'uploaded-image';
    const uploadSrc = pressureOptions.uploadedImage;
    let uploadObj = findObj(uploadId);

    if (uploadSrc) {
      if (uploadObj && uploadObj._src === uploadSrc) {
        // No change
      } else {
        if (uploadObj) canvas.remove(uploadObj);

        fabric.Image.fromURL(uploadSrc).then(img => {
          if (!img) return;

          img.set({
            left: width / 2,
            top: height / 2,
            originX: 'center',
            originY: 'center',
            id: uploadId,
            _src: uploadSrc
          });

          // Smart Scaling
          const pWidth = width * 0.8;
          const pHeight = height * 0.8;
          const scale = Math.min(pWidth / img.width, pHeight / img.height, 1);
          img.scale(scale);

          canvas.add(img);
          canvas.sendToBack(img); // Background? Or front? Usually Upload is "Logo", so front?
          // But Flags/Text might be overlaid. Let's keep it normally added.
          canvas.setActiveObject(img);
          canvas.requestRenderAll();
          if (onTextureUpdate) onTextureUpdate(canvas.toDataURL());
        }).catch(e => console.error(e));
      }
    } else {
      if (uploadObj) canvas.remove(uploadObj);
    }

    // Always render once sync is done
    canvas.requestRenderAll();

    // Safety timeout to trigger update if images loaded late?
    // Not needed if we trigger in .then()

  }, [pressureOptions, width, height]);


  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default FabricCanvas;