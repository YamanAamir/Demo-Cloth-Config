import React, { useState, useEffect } from 'react';
import Test from './Test';
import { X, Globe, Upload, ChevronRight, Loader2, CheckCircle } from 'lucide-react';
import { getCountries, getLibraryDesigns } from '../api/api';
import { BASE_URL } from '../utils/const';

// Color tab definitions (English labels)
const COLOR_TABS = [
    { key: 'white',  label: 'White',  sub: 'Black print' },
    { key: 'black',  label: 'Black',  sub: 'White print' },
    // { key: 'normal', label: 'Normal', sub: 'Original print' },
];

const BackDesignPopup = ({ onFinish, customizations, setCustomizations, students, backDesigns }) => {
    const [activeTab, setActiveTab] = useState('T-SHIRT');
    const [activeSection, setActiveSection] = useState('library'); // 'library' | 'upload'
    const [designColorTab, setDesignColorTab] = useState('white'); // 'normal' | 'white' | 'black'

    // Library state
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [libraryDesigns, setLibraryDesigns] = useState([]);
    const [countriesLoading, setCountriesLoading] = useState(false);
    const [designsLoading, setDesignsLoading] = useState(false);
    const [selectedLibraryDesign, setSelectedLibraryDesign] = useState(null);

    const productTabs = [
        { name: 'T-SHIRT', postEx: 'T-Shirt:' },
        { name: 'SWEATSHIRT', postEx: 'SweatShirt:' },
        { name: 'HOODIE', postEx: 'Hoodie:' },
        { name: 'ZIPPERHOODIE', postEx: 'ZipperHoodie:' },
    ];

    // Fetch countries on mount
    useEffect(() => {
        fetchCountries();
    }, []);

    // Fetch designs when country changes
    useEffect(() => {
        if (selectedCountry) fetchDesigns(selectedCountry.id);
    }, [selectedCountry]);

    const fetchCountries = async () => {
        setCountriesLoading(true);
        try {
            const res = await getCountries();
            if (res.data?.success) {
                const list = res.data.data || [];
                setCountries(list);
                if (list.length > 0) setSelectedCountry(list[0]);
            }
        } catch (err) {
            console.error('Failed to fetch countries:', err);
        } finally {
            setCountriesLoading(false);
        }
    };

    const fetchDesigns = async (countryId) => {
        setDesignsLoading(true);
        setLibraryDesigns([]);
        try {
            const res = await getLibraryDesigns(countryId);
            if (res.data?.success) setLibraryDesigns(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch library designs:', err);
        } finally {
            setDesignsLoading(false);
        }
    };

    // ✅ Apply API backDesign to all students automatically on mount
    useEffect(() => {
        if (backDesigns?.data) {
            setCustomizations(prev => {
                const nextCustom = { ...prev };
                const shirtCategories = ['T-SHIRT', 'SWEATSHIRT', 'HOODIE', 'ZIPPERHOODIE'];
                students.forEach(student => {
                    const studentName = typeof student === 'object' ? (student.name || student.id) : student;
                    const studentData = nextCustom[studentName] || {};
                    shirtCategories.forEach(cat => {
                        const categoryData = studentData[cat] || {};
                        studentData[cat] = {
                            ...categoryData,
                            pressureOptions: {
                                ...(categoryData.pressureOptions || {}),
                                backDesign: backDesigns.data
                            }
                        };
                    });
                    nextCustom[studentName] = { ...studentData };
                });
                return nextCustom;
            });
        }
    }, [backDesigns, students, setCustomizations]);

    const currentTab = productTabs.find((t) => t.name === activeTab);
    const firstStudentName = students.length > 0 ? (typeof students[0] === 'object' ? (students[0].name || students[0].id) : students[0]) : "";
    const firstStudentData = customizations[firstStudentName] || {};
    const currentCategoryData = firstStudentData[activeTab] || {};
    const currentBackDesign = currentCategoryData.pressureOptions?.backDesign;

    // Filter library designs by active color tab
    // normal tab → designs where designColor is null, undefined, or 'normal'
    // white/black tab → exact match
    const filteredLibraryDesigns = libraryDesigns.filter(d => {
        const dc = d.designColor;
        if (designColorTab === 'normal') return !dc || dc === 'normal';
        return dc === designColorTab;
    });

    // Switch PlayCanvas page when tab changes
    useEffect(() => {
        const pageIndex = productTabs.findIndex(t => t.name === activeTab) + 1;
        ['preview-iframe', 'preview-iframe2'].forEach((id) => {
            const iframe = document.getElementById(id);
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage(`Page : ${pageIndex}`, "*");
            }
        });
    }, [activeTab]);

    const handleUpdate = (update) => {
        if (update.canvasBase64) {
            const raw = update.canvasBase64.rawData;
            const rawDiffuse = raw?.diffuse || "";
            const rawOpacity = raw?.opacity || "";
            // Garment prefix map: postEx → PlayCanvas prefix
            const prefixMap = {
                'T-Shirt:':       'T-Shirt:',
                'SweatShirt:':    'SweatShirt:',
                'Hoodie:':        'Hoodie:',
                'ZipperHoodie:':  'ZipperHoodie:',
            };
            ['preview-iframe', 'preview-iframe2'].forEach((id) => {
                const iframe = document.getElementById(id);
                if (!iframe?.contentWindow) return;
                Object.values(prefixMap).forEach(prefix => {
                    if (designColorTab === 'white') {
                        // White garment → black print
                        if (rawDiffuse) iframe.contentWindow.postMessage(prefix + 'back_black_diffuse: ' + rawDiffuse, '*');
                        if (rawOpacity) iframe.contentWindow.postMessage(prefix + 'back_black_opacity: ' + rawOpacity, '*');
                    } else if (designColorTab === 'black') {
                        // Black garment → white print
                        // Plain white opacity for full white print area
                        const whiteCanvas = document.createElement("canvas");
                        whiteCanvas.width = 400; whiteCanvas.height = 400;
                        const wctx = whiteCanvas.getContext("2d");
                        wctx.fillStyle = "#ffffff";
                        wctx.fillRect(0, 0, 400, 400);
                        const opacityW64 = whiteCanvas.toDataURL("image/png");
                        if (rawDiffuse) iframe.contentWindow.postMessage(prefix + 'back_white_diffuse: ' + "", '*');
                        iframe.contentWindow.postMessage(prefix + 'back_white_opacity: ' + opacityW64, '*');
                    } else {
                        // Normal → original (disabled)
                        // if (rawDiffuse) iframe.contentWindow.postMessage(prefix + 'back_normal_diffuse: ' + rawDiffuse, '*');
                        // if (rawDiffuse) iframe.contentWindow.postMessage(prefix + 'back_diffuse: ' + rawOpacity, '*');
                    }
                });
            });
        }
        if (update.backDesign !== undefined) {
            setCustomizations(prev => {
                const nextCustom = { ...prev };
                students.forEach(student => {
                    const studentName = typeof student === 'object' ? (student.name || student.id) : student;
                    const studentData = nextCustom[studentName] || {};
                    const shirtCategories = ['T-SHIRT', 'SWEATSHIRT', 'HOODIE', 'ZIPPERHOODIE'];
                    shirtCategories.forEach(cat => {
                        const categoryData = studentData[cat] || {};
                        studentData[cat] = {
                            ...categoryData,
                            pressureOptions: { ...(categoryData.pressureOptions || {}), backDesign: update.backDesign }
                        };
                    });
                    nextCustom[studentName] = { ...studentData };
                });
                return nextCustom;
            });
        }
    };

    // When user selects a library design → load it into Test canvas via pressureOptions
    const handleLibrarySelect = (design) => {
        setSelectedLibraryDesign(design);
        const rawPath = (design.file_path || design.image_path || "").replace(/\\/g, "/"); const src = rawPath.startsWith("http") ? rawPath : `${BASE_URL}${rawPath.startsWith("/") ? rawPath.slice(1) : rawPath}`;
        const backDesignObj = {
            src,
            designId: design.id,
            designColor: design.designColor || designColorTab, // use design's own color or active tab
            pos: { x: 200, y: 200 },
            size: { w: 300, h: 300 },
            angle: 0,
            locked: true,
        };
        // Apply to all students & all garment types
        setCustomizations(prev => {
            const nextCustom = { ...prev };
            const shirtCategories = ['T-SHIRT', 'SWEATSHIRT', 'HOODIE', 'ZIPPERHOODIE'];
            students.forEach(student => {
                const studentName = typeof student === 'object' ? (student.name || student.id) : student;
                const studentData = nextCustom[studentName] || {};
                shirtCategories.forEach(cat => {
                    const categoryData = studentData[cat] || {};
                    studentData[cat] = {
                        ...categoryData,
                        pressureOptions: {
                            ...(categoryData.pressureOptions || {}),
                            backDesign: backDesignObj
                        }
                    };
                });
                nextCustom[studentName] = { ...studentData };
            });
            return nextCustom;
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Back Design</h2>
                        <p className="text-gray-400 text-xs mt-0.5">Applied to all students across all garments</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onFinish}
                            className="px-6 py-2 bg-green-700 text-white font-semibold rounded-xl hover:bg-green-800 transition text-sm shadow"
                        >
                            Finish
                        </button>
                        <button onClick={onFinish} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Section tabs — Library vs Upload */}
                <div className="flex border-b border-gray-100 px-6">
                    {[
                        { key: 'library', label: 'Browse Library', icon: Globe },
                        { key: 'upload', label: 'Upload / Edit', icon: Upload },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveSection(key)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all mr-2 ${
                                activeSection === key
                                    ? 'border-green-600 text-green-700'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* ── LIBRARY SECTION ── */}
                    {activeSection === 'library' && (
                        <div className="flex flex-1 overflow-hidden flex-col">
                            {/* Color tabs: White / Black — card style */}
                            <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                                <p className="text-sm font-semibold text-gray-800 mb-3">Garment Color</p>
                                <div className="flex gap-3">
                                    {COLOR_TABS.map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => {
                                                setDesignColorTab(tab.key);
                                                setSelectedLibraryDesign(null);
                                            }}
                                            className={`flex-1 flex flex-col items-center justify-center py-3 px-4 rounded-xl border-2 transition-all bg-white ${
                                                designColorTab === tab.key
                                                    ? 'border-green-500 bg-green-50 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className={`text-sm font-bold ${designColorTab === tab.key ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {tab.label}
                                            </span>
                                            <span className="text-xs text-gray-400 mt-0.5">{tab.sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-1 overflow-hidden">
                                {/* Country sidebar */}
                                <div className="w-44 border-r border-gray-100 overflow-y-auto flex-shrink-0 py-3">
                                    {countriesLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                        </div>
                                    ) : countries.length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-6 px-3">No countries found</p>
                                    ) : (
                                        countries.map(country => (
                                            <button
                                                key={country.id}
                                                onClick={() => setSelectedCountry(country)}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-between ${
                                                    selectedCountry?.id === country.id
                                                        ? 'bg-green-50 text-green-700 border-r-2 border-green-600'
                                                        : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span className="truncate">{country.name}</span>
                                                {selectedCountry?.id === country.id && (
                                                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>

                                {/* Designs grid — filtered by designColorTab */}
                                <div className="flex-1 overflow-y-auto p-4">
                                    {designsLoading ? (
                                        <div className="flex items-center justify-center h-40">
                                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                        </div>
                                    ) : filteredLibraryDesigns.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                            <Globe className="w-8 h-8 mb-2 opacity-40" />
                                            <p className="text-sm">
                                                {libraryDesigns.length === 0
                                                    ? 'No designs for this country'
                                                    : `No ${designColorTab} designs for this country`}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {filteredLibraryDesigns.map(design => {
                                                const rawPath2 = (design.file_path || design.image_path || "").replace(/\\/g, "/");
                                                const src = rawPath2.startsWith("http") ? rawPath2 : `${BASE_URL}${rawPath2.startsWith("/") ? rawPath2.slice(1) : rawPath2}`;
                                                const isSelected = selectedLibraryDesign?.id === design.id;
                                                // Background preview colour based on designColor
                                                const previewBg = design.designColor === 'black' ? '#222' : '#f9fafb';
                                                return (
                                                    <button
                                                        key={design.id}
                                                        onClick={() => handleLibrarySelect(design)}
                                                        className={`relative group rounded-xl overflow-hidden border-2 transition-all aspect-square ${
                                                            isSelected
                                                                ? 'border-green-500 shadow-lg shadow-green-100'
                                                                : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                                                        }`}
                                                        style={{ background: previewBg }}
                                                    >
                                                        <img
                                                            src={src}
                                                            alt={design.name}
                                                            className="w-full h-full object-contain p-2"
                                                            onError={e => { e.target.style.display = 'none'; }}
                                                        />
                                                        {/* Selected badge */}
                                                        {isSelected && (
                                                            <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow">
                                                                <CheckCircle className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}
                                                        {/* Name tooltip on hover */}
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-medium px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                                                            {design.name}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Selected design info */}
                                    {selectedLibraryDesign && (
                                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-green-800">
                                                    "{selectedLibraryDesign.name}" selected
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    Applied to all students ({designColorTab} mode). Switch to "Upload / Edit" to adjust position.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── UPLOAD / EDIT SECTION ── */}
                    {activeSection === 'upload' && (
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Color tabs above canvas — card style */}
                            <div className="mb-5">
                                <p className="text-sm font-semibold text-gray-800 mb-3">Garment Color</p>
                                <div className="flex gap-3">
                                    {COLOR_TABS.map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setDesignColorTab(tab.key)}
                                            className={`flex-1 flex flex-col items-center justify-center py-3 px-4 rounded-xl border-2 transition-all bg-white ${
                                                designColorTab === tab.key
                                                    ? 'border-green-500 bg-green-50 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className={`text-sm font-bold ${designColorTab === tab.key ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {tab.label}
                                            </span>
                                            <span className="text-xs text-gray-400 mt-0.5">{tab.sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                                <Test
                                    key={`${activeTab}-${designColorTab}`}
                                    postEx={currentTab.postEx}
                                    pressureOptions={{ backDesign: currentBackDesign }}
                                    onUpdate={handleUpdate}
                                    backDesigns={backDesigns}
                                    designColor={designColorTab}
                                />
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default BackDesignPopup;
