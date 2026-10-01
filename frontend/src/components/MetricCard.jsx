import React from 'react';

export default function MetricCard({ 
  title, 
  value, 
  unit = '', 
  subtext, 
  icon: Icon, 
  accent = 'cyan',
  badgeText = null
}) {
  return (
    <div className={`glass-card stat-card accent-${accent}`}>
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div className="stat-icon">
            <Icon size={20} />
          </div>
        )}
      </div>

      <div>
        <div className="stat-value">
          {value !== null && value !== undefined ? value : '--'}
          {unit && <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '6px', color: 'var(--text-secondary)' }}>{unit}</span>}
        </div>
        
        <div className="stat-subtext">
          {badgeText && (
            <span style={{ 
              padding: '2px 8px', 
              borderRadius: '4px', 
              fontSize: '0.72rem', 
              fontWeight: 600,
              background: 'rgba(255,255,255,0.06)',
              marginRight: '6px'
            }}>
              {badgeText}
            </span>
          )}
          {subtext}
        </div>
      </div>
    </div>
  );
}
