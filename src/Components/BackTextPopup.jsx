import React, { useState, useEffect, useRef, useCallback } from 'react';
import img1 from '../assets/menuimages/1.png';
import img2 from '../assets/menuimages/2.png';
import img3 from '../assets/menuimages/3.png';
import img4 from '../assets/menuimages/4.png';
import { X, Plus, Trash2, Type, MoveUp, MoveDown, Bold, Italic, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;

const DEFAULT_TEXT_ITEM = {
    text: '',
    fontSize: 32,
    color: '#FFFFFF',
    fontFamily: 'Arial',
    bold: true,
    italic: false,
    align: 'center', // 'left' | 'center' | 'right'
};

const FONT_OPTIONS = [
    'Arial',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
    'Impact',
    'Comic Sans MS',
];

const COLOR_OPTIONS = [
    { name: 'White', value: '#FFFFFF' },
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#FF0000' },
    { name: 'Blue', value: '#0000FF' },
    { name: 'Green', value: '#00AA00' },
    { name: 'Yellow', value: '#FFD700' },
    { name: 'Orange', value: '#FF6600' },
    { name: 'Pink', value: '#FF69B4' },
];

const BackTextPopup = ({ onFinish, customizations, setCustomizations, students, isAppReady }) => {
    const [activeTab, setActiveTab] = useState('T-SHIRT');
    const canvasRef = useRef(null);

    const productTabs = [
        { name: 'T-SHIRT', icon: img1, postEx: 't-shirt:' },
        { name: 'SWEATSHIRT', icon: img2, postEx: 'sweatshirt:' },
        { name: 'HOODIE', icon: img3, postEx: 'hoodie:' },
        { name: 'ZIPPERHOODIE', icon: img4, postEx: 'zipperhoodie:' },
    ];

    // Get current back text items from the first student's data
    const firstStudentName = students.length > 0
        ? (typeof students[0] === 'object' ? (students[0].name || students[0].id) : students[0])
        : "";
    const firstStudentData = customizations[firstStudentName] || {};
    const currentCategoryData = firstStudentData[activeTab] || {};
    const currentBackTexts = currentCategoryData.pressureOptions?.backTexts || [];

    // Local state for editing
    const [textItems, setTextItems] = useState([]);

    // Load from customizations when tab changes
    useEffect(() => {
        setTextItems(currentBackTexts.length > 0
            ? currentBackTexts.map(t => ({ ...DEFAULT_TEXT_ITEM, ...t }))
            : []
        );
    }, [activeTab, firstStudentName]);

    // Draw canvas whenever textItems change
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (textItems.length === 0) {
            ctx.fillStyle = '#666666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Add text lines below', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            return;
        }

        // Calculate total height for vertical centering
        const lineSpacing = 8;
        const metrics = textItems.map(item => {
            const fontSize = item.fontSize || 32;
            return { fontSize, height: fontSize + lineSpacing };
        });
        let totalHeight = 0;
        metrics.forEach(m => totalHeight += m.height);
        totalHeight -= lineSpacing; // Remove last spacing

        let startY = (CANVAS_HEIGHT - totalHeight) / 2;

        textItems.forEach((item, idx) => {
            const fontSize = item.fontSize || 32;
            const fontFamily = item.fontFamily || 'Arial';
            const color = item.color || '#FFFFFF';
            const bold = item.bold !== false;
            const italic = item.italic || false;
            const align = item.align || 'center';

            let fontStr = '';
            if (italic) fontStr += 'italic ';
            if (bold) fontStr += 'bold ';
            fontStr += `${fontSize}px ${fontFamily}`;

            ctx.font = fontStr;
            ctx.fillStyle = color;
            ctx.textBaseline = 'top';

            // Alignment
            let xPos;
            if (align === 'left') {
                ctx.textAlign = 'left';
                xPos = 20;
            } else if (align === 'right') {
                ctx.textAlign = 'right';
                xPos = CANVAS_WIDTH - 20;
            } else {
                ctx.textAlign = 'center';
                xPos = CANVAS_WIDTH / 2;
            }

            // Auto-shrink if text is too wide
            let adjustedFontSize = fontSize;
            while (ctx.measureText(item.text).width > CANVAS_WIDTH - 40 && adjustedFontSize > 12) {
                adjustedFontSize -= 1;
                let shrinkFont = '';
                if (italic) shrinkFont += 'italic ';
                if (bold) shrinkFont += 'bold ';
                shrinkFont += `${adjustedFontSize}px ${fontFamily}`;
                ctx.font = shrinkFont;
            }

            if (item.text.trim()) {
                ctx.fillText(item.text, xPos, startY);
            }
            startY += metrics[idx].height;
        });
    }, [textItems]);

    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    // ── Generate and send canvas data to PlayCanvas (same as Test.jsx) ──
    const sendToPlayCanvas = useCallback(() => {
        if (!isAppReady) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const currentTab = productTabs.find(t => t.name === activeTab);
        if (!currentTab) return;

        const postEx = currentTab.postEx;

        // 1. Diffuse (the main colored text canvas)
        let diffuseBase64 = '';
        try {
            diffuseBase64 = canvas.toDataURL('image/png');
        } catch (err) {
            console.warn("Canvas toDataURL failed:", err);
            return;
        }

        // 2. Opacity mask (inverted — white = opaque, black = transparent)
        // Exactly same method as Test.jsx
        const opacityCanvas = document.createElement('canvas');
        opacityCanvas.width = CANVAS_WIDTH;
        opacityCanvas.height = CANVAS_HEIGHT;
        const octx = opacityCanvas.getContext('2d');

        octx.filter = 'invert(100%)';
        octx.drawImage(canvas, 0, 0);
        octx.filter = 'none';

        let opacityBase64 = '';
        try {
            opacityBase64 = opacityCanvas.toDataURL('image/png');
        } catch (err) {
            console.warn("Opacity canvas failed:", err);
        }

        // 3. Send to PlayCanvas iframes (fixed format to avoid CORS)
        if (diffuseBase64 && opacityBase64) {
            ['preview-iframe', 'preview-iframe2'].forEach(id => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    // We add a space after the colon to prevent browser protocol detection
                    iframe.contentWindow.postMessage(postEx + 'back_diffuse: ' + diffuseBase64, '*');
                    iframe.contentWindow.postMessage(postEx + 'back_opacity: ' + opacityBase64, '*');
                    iframe.contentWindow.postMessage(postEx + 'back_emissive: ' + diffuseBase64, '*');
                }
            });
        }
    }, [activeTab, textItems]);

    useEffect(() => {
        const timer = setTimeout(() => {
            sendToPlayCanvas();
        }, 150);
        return () => clearTimeout(timer);
    }, [textItems, sendToPlayCanvas, isAppReady]);

    // Save to customizations for ALL students (same pattern as BackDesignPopup)
    const saveToCustomizations = useCallback((updatedItems) => {
        setCustomizations(prev => {
            const nextCustom = { ...prev };
            const shirtCategories = ['T-SHIRT', 'SWEATSHIRT', 'HOODIE', 'ZIPPERHOODIE'];

            students.forEach(student => {
                const studentName = typeof student === 'object' ? (student.name || student.id) : student;
                const studentData = nextCustom[studentName] || {};

                // Sync to all shirt types
                let targetCategories = shirtCategories.includes(activeTab) ? shirtCategories : [activeTab];

                targetCategories.forEach(cat => {
                    const categoryData = studentData[cat] || {};
                    studentData[cat] = {
                        ...categoryData,
                        pressureOptions: {
                            ...(categoryData.pressureOptions || {}),
                            backTexts: updatedItems.map(({ text, fontSize, color, fontFamily, bold, italic, align }) => ({
                                text, fontSize, color, fontFamily, bold, italic, align
                            })),
                        }
                    };
                });

                nextCustom[studentName] = { ...studentData };
            });
            return nextCustom;
        });
    }, [activeTab, students, setCustomizations]);

    // ── Handlers ──
    const addTextItem = () => {
        const updated = [...textItems, { ...DEFAULT_TEXT_ITEM }];
        setTextItems(updated);
        saveToCustomizations(updated);
    };

    const removeTextItem = (idx) => {
        const updated = textItems.filter((_, i) => i !== idx);
        setTextItems(updated);
        saveToCustomizations(updated);
    };

    const updateTextItem = (idx, field, value) => {
        const updated = textItems.map((item, i) => i === idx ? { ...item, [field]: value } : item);
        setTextItems(updated);
        saveToCustomizations(updated);
    };

    const moveTextItem = (idx, direction) => {
        const newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= textItems.length) return;
        const updated = [...textItems];
        [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
        setTextItems(updated);
        saveToCustomizations(updated);
    };

    // Switch PlayCanvas page when tab changes
    useEffect(() => {
        if (!isAppReady) return;
        const pageIndex = productTabs.findIndex(t => t.name === activeTab) + 1;
        ['preview-iframe', 'preview-iframe2'].forEach(id => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(`Page : ${pageIndex}`, '*');
            }
        });
    }, [activeTab, isAppReady]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Configure Global Back Text</h2>
                        <p className="text-gray-500 text-sm mt-1">Multiple text lines added here will be applied to ALL students.</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={onFinish}
                            className="px-8 py-2 bg-green-700 text-white font-bold rounded-xl hover:bg-green-800 transition shadow-lg shrink-0"
                        >
                            Finish
                        </button>
                        <button
                            onClick={onFinish}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            title="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="flex md:flex-col overflow-x-auto md:overflow-y-auto gap-2 md:w-48 pb-2">
                        {productTabs.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-w-[140px] md:min-w-0 ${activeTab === tab.name
                                    ? 'bg-green-50 border-2 border-green-600 shadow-sm'
                                    : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                                    }`}
                            >
                                <img src={tab.icon} alt={tab.name} className="w-8 h-8 object-contain" />
                                <span className={`text-xs font-bold ${activeTab === tab.name ? 'text-green-700' : 'text-gray-600'}`}>
                                    {tab.name}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Main Area */}
                    <div className="flex-1 bg-gray-50 rounded-2xl p-6 border border-gray-200 overflow-y-auto">
                        {/* Section Title */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-100 rounded-xl">
                                <Type className="w-5 h-5 text-green-700" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Back Text Lines</h3>
                                <p className="text-xs text-gray-500">Add multiple text lines for the back of the clothing. Each line has its own style options.</p>
                            </div>
                        </div>

                        {/* Text Items List */}
                        <div className="space-y-4 mb-6">
                            {textItems.length === 0 && (
                                <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-gray-200">
                                    <Type className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-400 font-medium">No text lines added yet</p>
                                    <p className="text-gray-400 text-sm">Click "Add Text Line" to get started</p>
                                </div>
                            )}

                            {textItems.map((item, idx) => (
                                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    {/* Line Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Line {idx + 1}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => moveTextItem(idx, -1)}
                                                disabled={idx === 0}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                title="Move Up"
                                            >
                                                <MoveUp className="w-4 h-4 text-gray-500" />
                                            </button>
                                            <button
                                                onClick={() => moveTextItem(idx, 1)}
                                                disabled={idx === textItems.length - 1}
                                                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                title="Move Down"
                                            >
                                                <MoveDown className="w-4 h-4 text-gray-500" />
                                            </button>
                                            <button
                                                onClick={() => removeTextItem(idx)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-all"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Text Input */}
                                    <input
                                        type="text"
                                        value={item.text}
                                        onChange={(e) => updateTextItem(idx, 'text', e.target.value)}
                                        placeholder="Enter text..."
                                        maxLength={30}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-gray-800 font-medium mb-3 transition-all"
                                    />

                                    {/* Row 1 — Font Size & Font Family */}
                                    <div className="flex flex-wrap gap-3 mb-3">
                                        {/* Font Size */}
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-gray-500 font-medium">Size:</label>
                                            <select
                                                value={item.fontSize}
                                                onChange={(e) => updateTextItem(idx, 'fontSize', parseInt(e.target.value))}
                                                className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 bg-white"
                                            >
                                                {[12, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72].map(s => (
                                                    <option key={s} value={s}>{s}px</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Font Family */}
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-gray-500 font-medium">Font:</label>
                                            <select
                                                value={item.fontFamily}
                                                onChange={(e) => updateTextItem(idx, 'fontFamily', e.target.value)}
                                                className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 bg-white"
                                            >
                                                {FONT_OPTIONS.map(f => (
                                                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Bold Toggle */}
                                        <button
                                            onClick={() => updateTextItem(idx, 'bold', !item.bold)}
                                            className={`p-1.5 rounded-lg border transition-all ${item.bold
                                                ? 'bg-green-100 border-green-400 text-green-700'
                                                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                                }`}
                                            title="Bold"
                                        >
                                            <Bold className="w-4 h-4" />
                                        </button>

                                        {/* Italic Toggle */}
                                        <button
                                            onClick={() => updateTextItem(idx, 'italic', !item.italic)}
                                            className={`p-1.5 rounded-lg border transition-all ${item.italic
                                                ? 'bg-green-100 border-green-400 text-green-700'
                                                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                                                }`}
                                            title="Italic"
                                        >
                                            <Italic className="w-4 h-4" />
                                        </button>

                                        {/* Alignment */}
                                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => updateTextItem(idx, 'align', 'left')}
                                                className={`p-1.5 transition-all ${item.align === 'left'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-white text-gray-400 hover:bg-gray-50'
                                                    }`}
                                                title="Align Left"
                                            >
                                                <AlignLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => updateTextItem(idx, 'align', 'center')}
                                                className={`p-1.5 transition-all border-x border-gray-200 ${item.align === 'center'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-white text-gray-400 hover:bg-gray-50'
                                                    }`}
                                                title="Align Center"
                                            >
                                                <AlignCenter className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => updateTextItem(idx, 'align', 'right')}
                                                className={`p-1.5 transition-all ${item.align === 'right'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-white text-gray-400 hover:bg-gray-50'
                                                    }`}
                                                title="Align Right"
                                            >
                                                <AlignRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Row 2 — Color */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-500 font-medium">Color:</label>
                                        <div className="flex gap-1.5">
                                            {COLOR_OPTIONS.map(c => (
                                                <button
                                                    key={c.value}
                                                    onClick={() => updateTextItem(idx, 'color', c.value)}
                                                    className={`w-6 h-6 rounded-full border-2 transition-all ${item.color === c.value
                                                        ? 'border-green-600 scale-110 shadow-md'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                    style={{ backgroundColor: c.value }}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={addTextItem}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 border-2 border-dashed border-green-300 rounded-xl text-green-700 font-semibold hover:bg-green-100 hover:border-green-400 transition-all mb-6"
                        >
                            <Plus className="w-5 h-5" />
                            Add Text Line
                        </button>

                        {/* Canvas Preview */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Preview</label>
                            <canvas
                                ref={canvasRef}
                                width={CANVAS_WIDTH}
                                height={CANVAS_HEIGHT}
                                className="border-2 border-gray-300 rounded-lg shadow-lg block mx-auto bg-gray-900"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackTextPopup;
