import React from 'react';
import { Sun, Moon, Database, Cpu, Wifi, Activity } from 'lucide-react';

export default function Navbar({ 
  theme, 
  toggleTheme, 
  systemStatus, 
  activeTab 
}) {
  const getPageTitle = (tab) => {
    switch (tab) {
      case 'dashboard': return 'Live Monitoring Dashboard';
      case 'analytics': return 'Historical Telemetry & Analytics';
      case 'predictions': return 'Machine Learning Demand Forecast';
      case 'anomalies': return 'Unusual Pattern & Anomaly Detection';
      case 'recommendations': return 'Energy-Saving Recommendations';
      case 'settings': return 'Hardware & System Settings';
      default: return 'Monitoring Dashboard';
    }
  };

  const isConnected = systemStatus?.arduino_connected;
  const isSim = systemStatus?.simulation_mode;

  return (
    <header className="top-header">
      <div className="header-left">
        <h2 className="header-title">{getPageTitle(activeTab)}</h2>
        <div className="header-subtitle">
          IoT-Based Smart Light and Energy Usage Monitoring System
        </div>
      </div>

      <div className="header-right">
        {/* Simulation / Hardware Badge */}
        {isSim ? (
          <span className="badge badge-simulation">
            <Activity size={12} />
            Simulation Mode Active
          </span>
        ) : (
          <span className={`badge ${isConnected ? 'badge-connected' : 'badge-disconnected'}`}>
            <span className={`pulse-dot ${isConnected ? 'online' : ''}`} style={{ backgroundColor: isConnected ? '#10B981' : '#F43F5E' }} />
            {isConnected ? `Arduino: ${systemStatus?.serial_port || 'Connected'}` : 'Arduino Disconnected'}
          </span>
        )}

        {/* Database records badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <Database size={15} color="#38BDF8" />
          <span><strong>{systemStatus?.database_records_count?.toLocaleString() || 0}</strong> logs</span>
        </div>

        {/* Theme Toggle Button */}
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
