// import React, { useState, useEffect } from 'react';

// const StudentPopup = ({ setMode, setStudents }) => {
//   const [step, setStep] = useState('choose'); // 'choose' | 'individual' | 'batch'
//   const [individualName, setIndividualName] = useState('');
//   const [batchNames, setBatchNames] = useState(['']);

//   // Fix: Move the setMode call to useEffect to avoid updating during render
//   useEffect(() => {
//     const hasSeen = localStorage.getItem('hasSeenStudentPopup') === 'true';
//     if (hasSeen && step === 'choose') {
//       setMode('individual');
//     }
//   }, [step, setMode]);

//   const addBatchField = () => {
//     if (batchNames.length < 10) {
//       setBatchNames([...batchNames, '']);
//     }
//   };

//   const removeBatchField = (index) => {
//     if (batchNames.length > 1) {
//       setBatchNames(batchNames.filter((_, i) => i !== index));
//     }
//   };

//   const updateBatchName = (index, value) => {
//     const newNames = [...batchNames];
//     newNames[index] = value;
//     setBatchNames(newNames);
//   };

//   const handleSubmit = () => {
//     let finalStudents = [];
//     if (step === 'individual') {
//       if (!individualName.trim()) {
//         alert('Please enter student name');
//         return;
//       }
//       finalStudents = [individualName.trim()];
//     } else if (step === 'batch') {
//       finalStudents = batchNames
//         .map(n => n.trim())
//         .filter(n => n.length > 0);
//       if (finalStudents.length === 0) {
//         alert('Please enter at least one student name');
//         return;
//       }
//     }
//     // Save
//     localStorage.setItem('students', JSON.stringify(finalStudents));
//     setStudents(finalStudents);
//     setMode(step); // 'individual' or 'batch'
//     // Optional: prevent showing popup again
//     // localStorage.setItem('hasSeenStudentPopup', 'true');
//     alert('Saved successfully!');
//   };

//   const handleClose = () => {
//     // You can decide whether to allow closing without saving
//     // For now: just close (user can refresh if needed)
//     setMode('individual'); // fallback default
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 backdrop-blur-2xl bg-opacity-60 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold text-gray-900">Add Students</h2>
//         </div>
//         {step === 'choose' && (
//           <div className="space-y-4">
//             <button
//               onClick={() => setStep('individual')}
//               className="w-full py-5 px-6 bg-green-800 text-white font-semibold rounded-2xl hover:bg-green-700 transition text-lg"
//             >
//               Individual Student
//             </button>
//             <button
//               onClick={() => setStep('batch')}
//               className="w-full py-5 px-6 bg-green-800 text-white font-semibold rounded-2xl hover:bg-green-700 transition text-lg"
//             >
//               Multiple Students (Batch)
//             </button>
//           </div>
//         )}
//         {step === 'individual' && (
//           <div className="space-y-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Student Name
//               </label>
//               <input
//                 type="text"
//                 value={individualName}
//                 onChange={(e) => setIndividualName(e.target.value)}
//                 placeholder="Enter full name"
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//               />
//             </div>
//             <div className="flex gap-3 justify-end">
//               <button
//                 onClick={() => setStep('choose')}
//                 className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
//               >
//                 Back
//               </button>
//               <button
//                 onClick={handleSubmit}
//                 className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-600"
//               >
//                 Save & Continue
//               </button>
//             </div>
//           </div>
//         )}
//         {step === 'batch' && (
//           <div className="space-y-6">
//             <label className="block text-sm font-medium text-gray-700">
//               Student Names (max 10)
//             </label>
//             <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
//               {batchNames.map((name, idx) => (
//                 <div key={idx} className="flex items-center gap-3">
//                   <input
//                     type="text"
//                     value={name}
//                     onChange={(e) => updateBatchName(idx, e.target.value)}
//                     placeholder={`Student ${idx + 1}`}
//                     className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                   />
//                   {batchNames.length > 1 && (
//                     <button
//                       onClick={() => removeBatchField(idx)}
//                       className="text-red-600 hover:text-red-800 text-2xl font-bold px-2"
//                     >
//                       ×
//                     </button>
//                   )}
//                 </div>
//               ))}
//             </div>
//             {batchNames.length < 10 && (
//               <button
//                 onClick={addBatchField}
//                 className="text-green-700 hover:text-green-800 font-medium flex items-center gap-1"
//               >
//                 + Add another student
//               </button>
//             )}
//             <div className="flex gap-3 justify-end pt-4">
//               <button
//                 onClick={() => setStep('choose')}
//                 className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
//               >
//                 Back
//               </button>
//               <button
//                 onClick={handleSubmit}
//                 className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-600"
//               >
//                 Save & Continue
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default StudentPopup;
import React, { useState } from "react";
import { message } from "antd";

const StudentPopup = ({ setMode, setStudents }) => {
  const [activeTab, setActiveTab] = useState("individual");
  const [individualName, setIndividualName] = useState("");
  const [batchNames, setBatchNames] = useState([""]);

  const addBatchField = () => {
    if (batchNames.length < 10) {
      setBatchNames([...batchNames, ""]);
    }
  };

  const removeBatchField = (index) => {
    if (batchNames.length > 1) {
      setBatchNames(batchNames.filter((_, i) => i !== index));
    }
  };

  const updateBatchName = (index, value) => {
    const newNames = [...batchNames];
    newNames[index] = value;
    setBatchNames(newNames);
  };

  const handleSubmit = () => {
    let finalStudents = [];

    if (activeTab === "individual") {
      if (!individualName.trim()) {
        message.error("Please enter student name");
        return;
      }
      finalStudents = [individualName.trim()];
    } else {
      finalStudents = batchNames
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      if (finalStudents.length === 0) {
        message.error("Please enter at least one student name");
        return;
      }
    }

    localStorage.setItem("students", JSON.stringify(finalStudents));
    setStudents(finalStudents);
    setMode(activeTab);
    message.success("Saved successfully!");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="px-8 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Add Students
          </h2>

          {/* TABS */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("individual")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${activeTab === "individual"
                ? "bg-white shadow text-green-700"
                : "text-gray-500"
                }`}
            >
              Individual
            </button>

            <button
              onClick={() => setActiveTab("batch")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${activeTab === "batch"
                ? "bg-white shadow text-green-700"
                : "text-gray-500"
                }`}
            >
              Batch (Multiple)
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-8 py-6 space-y-6 max-h-[65vh] overflow-y-auto">

          {/* Individual Tab */}
          {activeTab === "individual" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Name
              </label>
              <input
                type="text"
                value={individualName}
                onChange={(e) => setIndividualName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-4 py-3 border border-gray-300 outline-none rounded-xl focus:ring-2 focus:ring-green-300 focus:border-green-300 transition"
              />
            </div>
          )}

          {/* Batch Tab */}
          {activeTab === "batch" && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Student Names (max 10)
              </label>

              {batchNames.map((name, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updateBatchName(idx, e.target.value)}
                    placeholder={`Student ${idx + 1}`}
                    className="flex-1 px-4 py-3 border border-gray-300 outline-none rounded-xl focus:ring-2 focus:ring-green-300 focus:border-green-300 transition"
                  />
                  {batchNames.length > 1 && (
                    <button
                      onClick={() => removeBatchField(idx)}
                      className="text-red-500 hover:text-red-700 text-xl font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {batchNames.length < 10 && (
                <button
                  onClick={addBatchField}
                  className="text-green-700 hover:text-green-800 font-medium"
                >
                  + Add another student
                </button>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-8 pb-6">
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-semibold rounded-xl transition shadow-md"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentPopup;
