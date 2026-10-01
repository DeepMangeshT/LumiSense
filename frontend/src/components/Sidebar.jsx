import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  BrainCircuit, 
  AlertTriangle, 
  Lightbulb, 
  Sliders, 
  Sun,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, simulationMode }) {
  const navItems = [
    { id: 'dashboard', label: 'Live Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Historical Analytics', icon: BarChart3 },
    { id: 'predictions', label: 'ML Predictions', icon: BrainCircuit },
    { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { id: 'settings', label: 'Hardware & Settings', icon: Sliders },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Sun size={24} />
        </div>
        <div className="sidebar-logo-text">
          <h1>LumiSense</h1>
          <span>Smart IoT & ML</span>
        </div>
      </div>

      <ul className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li key={item.id}>
              <button
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', font: 'inherit' }}
              >
                <Icon className="icon" />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
            <ShieldCheck size={14} color="#38BDF8" />
            <span>Academic Project</span>
          </div>
          <div>B.Tech Final Year Mini-Project</div>
          <div style={{ marginTop: '6px', fontSize: '0.7rem' }}>
            Mode: <strong style={{ color: simulationMode ? '#C084FC' : '#10B981' }}>{simulationMode ? 'Simulation' : 'Real Hardware'}</strong>
          </div>
        </div>
      </div>
    </aside>
  );
}
