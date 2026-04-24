import React, { useState, useEffect } from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentDashboard from './Screens/StudentDashBoard';
import SuccessScreen from './Screens/SuccessScreen';
import CancelScreen from './Screens/CancelScreen';
import AutoTranslate from './AutoTranslate';
import StudentPopup from './Components/Popup.jsx';
import BackDesignPopup from './Components/BackDesignPopup.jsx';
// import BackTextPopup from './Components/BackTextPopup.jsx'; // COMMENTED: Back text feature disabled
import StudentRegister from './Pages/StudentRegister.jsx';
import StudentLogin from './Pages/StudentLogin.jsx';
import { useAuth } from './context/AuthContext';
import useBackDesignStore from './store/backDesignStore';

function App() {
  const { user, loading } = useAuth();
  // State is simplified. Students array and Mode states removed.
  const [customizations, setCustomizations] = useState(() => {
    const saved = localStorage.getItem('studentCustomizations');
    return saved ? JSON.parse(saved) : {};
  }); // student-specific customizations
  const [showBackPopup, setShowBackPopup] = useState(false);
  const [students, setStudents] = useState([]);
  // const [showBackTextPopup, setShowBackTextPopup] = useState(false); // COMMENTED: Back text feature disabled
  const [isAppReady, setIsAppReady] = useState(false);
  const { fetchBackDesigns, backDesigns } = useBackDesignStore();
  const getUser = localStorage.getItem('user');
  const userObj = getUser ? JSON.parse(getUser) : null;
  const getClassId = userObj?.class_id;

  useEffect(() => {
    if (getClassId) {
      fetchBackDesigns({ page: 1, limit: 100, class_id: getClassId });
    }
  }, [getClassId]);

  // Save customizations internally


  // Sync isAppReady from PlayCanvas
  useEffect(() => {
    const handleMessage = (event) => {
      if (typeof event.data === 'string' && event.data === 'app:ready') {
        console.log("App Ready signal received");
        setIsAppReady(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Sync state between tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'studentCustomizations' && e.newValue) {
        try { setCustomizations(JSON.parse(e.newValue)); } catch { }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);



  if (loading) return null; // Wait for auth initialization

  return (
    <>
      <AutoTranslate />
      {showBackPopup && (
        <BackDesignPopup
          students={students}
          customizations={customizations}
          setCustomizations={setCustomizations}
          onFinish={() => setShowBackPopup(false)}
          backDesigns={backDesigns}
        />
      )}
      {/* COMMENTED: Back text feature disabled */}
      {/* {showBackTextPopup && (
        <BackTextPopup
          students={students}
          customizations={customizations}
          setCustomizations={setCustomizations}
          onFinish={() => setShowBackTextPopup(false)}
          isAppReady={isAppReady}
        />
      )} */}
      <Routes>
        <Route path="/" element={
          user ? (
            <>
              <StudentDashboard
                  customizations={customizations}
                  setCustomizations={setCustomizations}
                  setShowBackPopup={setShowBackPopup}
                // setShowBackTextPopup={setShowBackTextPopup} // COMMENTED: Back text feature disabled
              />
            </>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        <Route path="/login" element={!user ? <StudentLogin /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!user ? <StudentRegister /> : <Navigate to="/" replace />} />
        <Route path="/payment-success" element={<SuccessScreen />} />
        <Route path="/payment-cancelled" element={<CancelScreen />} />
      </Routes>
    </>
  );
}

export default App;
