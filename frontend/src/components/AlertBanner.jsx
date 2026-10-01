import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function AlertBanner({ type = 'warning', message, onDismiss, actionText, onAction }) {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'critical': return <AlertCircle size={20} color="#F43F5E" />;
      case 'warning': return <AlertTriangle size={20} color="#F59E0B" />;
      default: return <Info size={20} color="#38BDF8" />;
    }
  };

  return (
    <div className={`alert-banner ${type}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {getIcon()}
        <span>{message}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {actionText && onAction && (
          <button 
            className="btn btn-secondary" 
            onClick={onAction}
            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
          >
            {actionText}
          </button>
        )}
        {onDismiss && (
          <button 
            onClick={onDismiss}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
