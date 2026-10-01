import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AlertBanner from './components/AlertBanner';

import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Predictions from './pages/Predictions';
import Anomalies from './pages/Anomalies';
import Recommendations from './pages/Recommendations';
import Settings from './pages/Settings';

import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('lumisense_theme') || 'dark');
  const [systemStatus, setSystemStatus] = useState(null);
  const [bannerAlert, setBannerAlert] = useState(null);

  // Apply theme to html root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lumisense_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const fetchStatus = async () => {
    try {
      const data = await api.getSystemStatus();
      setSystemStatus(data);

      // Manage alerts conditionally
      if (!data.arduino_connected && !data.simulation_mode) {
        setBannerAlert({
          type: 'warning',
          message: 'Arduino is disconnected and Simulation Mode is inactive. Connect Arduino Uno via USB or enable Simulation Mode.',
          actionText: 'Open Settings',
          onAction: () => setActiveTab('settings')
        });
      } else {
        setBannerAlert(null);
      }
    } catch (err) {
      console.warn("Could not reach LumiSense backend API:", err);
      setBannerAlert({
        type: 'critical',
        message: 'Unable to reach LumiSense backend server at http://localhost:8000. Please ensure the Python FastAPI backend is running.',
      });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard systemStatus={systemStatus} setActiveTab={setActiveTab} />;
      case 'analytics':
        return <Analytics />;
      case 'predictions':
        return <Predictions />;
      case 'anomalies':
        return <Anomalies />;
      case 'recommendations':
        return <Recommendations />;
      case 'settings':
        return <Settings systemStatus={systemStatus} refreshStatus={fetchStatus} />;
      default:
        return <Dashboard systemStatus={systemStatus} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        simulationMode={systemStatus?.simulation_mode} 
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar 
          theme={theme} 
          toggleTheme={toggleTheme} 
          systemStatus={systemStatus} 
          activeTab={activeTab} 
        />

        {bannerAlert && (
          <div style={{ padding: '16px 32px 0 32px' }}>
            <AlertBanner
              type={bannerAlert.type}
              message={bannerAlert.message}
              actionText={bannerAlert.actionText}
              onAction={bannerAlert.onAction}
              onDismiss={() => setBannerAlert(null)}
            />
          </div>
        )}

        {renderActivePage()}
      </div>
    </div>
  );
}
