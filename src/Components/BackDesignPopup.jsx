import React, { useState, useEffect } from 'react';
import Test from './Test';
import { X } from 'lucide-react';

const BackDesignPopup = ({ onFinish, customizations, setCustomizations, students, backDesigns }) => {
    const [activeTab, setActiveTab] = useState('T-SHIRT');
console.log("backDesignsasdad",backDesigns);

    const productTabs = [
        { name: 'T-SHIRT', postEx: 'T-Shirt:' },
        { name: 'SWEATSHIRT', postEx: 'SweatShirt:' },
        { name: 'HOODIE', postEx: 'Hoodie:' },
        { name: 'ZIPPERHOODIE', postEx: 'ZipperHoodie:' },
    ];

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

    // Use first student's data for UI preview
    const firstStudentName = students.length > 0 ? (typeof students[0] === 'object' ? (students[0].name || students[0].id) : students[0]) : "";
    const firstStudentData = customizations[firstStudentName] || {};
    const currentCategoryData = firstStudentData[activeTab] || {};
    const currentBackDesign = currentCategoryData.pressureOptions?.backDesign;

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

    // Handle manual updates from Test component if needed
    const handleUpdate = (update) => {
        // Send canvas to PlayCanvas iframes for ALL garment types
        if (update.canvasBase64) {
            const { diffuse, opacity, emissive } = update.canvasBase64;

            // Also broadcast for all other garment types with their prefixes
            const allPrefixes = ['T-Shirt:', 'SweatShirt:', 'Hoodie:', 'ZipperHoodie:'];
            ['preview-iframe', 'preview-iframe2'].forEach((id) => {
                const iframe = document.getElementById(id);
                if (iframe?.contentWindow) {
                    // Send for current active tab (already prefixed in diffuse/opacity)
                    if (diffuse) iframe.contentWindow.postMessage(diffuse, '*');
                    if (opacity) iframe.contentWindow.postMessage(opacity, '*');
                    if (emissive) iframe.contentWindow.postMessage(emissive, '*');

                    // Also send for all other garment types
                    allPrefixes.forEach(prefix => {
                        if (prefix !== currentTab.postEx) {
                            const rawDiffuse = update.canvasBase64.rawData?.diffuse;
                            const rawOpacity = update.canvasBase64.rawData?.opacity;
                            const rawEmissive = update.canvasBase64.rawData?.emissive;
                            if (rawDiffuse) iframe.contentWindow.postMessage(prefix + 'back_diffuse: ' + rawDiffuse, '*');
                            if (rawOpacity) iframe.contentWindow.postMessage(prefix + 'back_opacity: ' + rawOpacity, '*');
                            if (rawEmissive) iframe.contentWindow.postMessage(prefix + 'back_emissive: ' + rawEmissive, '*');
                        }
                    });
                }
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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Global Back Design</h2>
                        <p className="text-gray-500 text-sm mt-1">Design uploaded here will be applied to ALL students.</p>
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
                    <div className="flex-1 bg-gray-50 rounded-2xl p-6 border border-gray-200 overflow-y-auto">
                        <Test
                            key={activeTab} // refresh on tab change
                            postEx={currentTab.postEx}
                            pressureOptions={{ backDesign: currentBackDesign }}
                            onUpdate={handleUpdate}
                            backDesigns={backDesigns}
                            designColor={backDesigns?.designColor}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackDesignPopup;