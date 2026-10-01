import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Zap, 
  CheckCircle, 
  ShieldAlert, 
  RefreshCw, 
  Radio,
  Info
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { api } from '../services/api';

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState([]);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnomalies = async () => {
    try {
      const data = await api.getAnomalies(50);
      setAnomalies(data);
    } catch (err) {
      console.error("Error fetching anomalies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerAnomaly = async (type) => {
    setIsTriggering(true);
    setTriggerStatus(null);
    try {
      const res = await api.triggerAnomaly(type);
      setTriggerStatus(res.message);
      await fetchAnomalies();
    } catch (err) {
      setTriggerStatus(`Error: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="page-body">
      {/* Academic Disclosures */}
      <div style={{ 
        padding: '14px 20px', 
        borderRadius: '10px', 
        background: 'rgba(245, 158, 11, 0.08)', 
        border: '1px solid rgba(245, 158, 11, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '0.84rem',
        color: '#FDE68A'
      }}>
        <Info size={20} color="#F59E0B" style={{ flexShrink: 0 }} />
        <div>
          <strong>Terminology Notice:</strong> Unusual patterns identified by Isolation Forest reflect 
          <strong> Potential Lighting / Usage Inefficiencies</strong> or sensory anomalies. 
          The system does not claim to directly prove electrical wastage since it operates on environmental context.
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <MetricCard
          title="Total Anomalies Logged"
          value={anomalies.length}
          subtext="Unusual environmental events"
          icon={AlertTriangle}
          accent="rose"
        />

        <MetricCard
          title="Detection Model"
          value="Isolation Forest"
          subtext="Contamination factor: 0.04"
          icon={ShieldAlert}
          accent="cyan"
          badgeText="UNSUPERVISED"
        />

        <MetricCard
          title="Primary Pattern Detected"
          value="High Light + Idle"
          subtext="Luminaires on in empty room"
          icon={Flame}
          accent="amber"
          badgeText="INEFFICIENCY"
        />

        <MetricCard
          title="Anomaly Threshold"
          value="Score < -0.08"
          subtext="Statistical outlier boundary"
          icon={Radio}
          accent="purple"
          badgeText="METRIC"
        />
      </div>

      {/* Live Demo Anomaly Injection Sandbox */}
      <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #F59E0B' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={19} color="#F59E0B" />
              Live Demonstration Sandbox: Anomaly Injector
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '650px' }}>
              Use these buttons during your college project presentation to simulate real-time behavioral anomalies. 
              The system will immediately detect the pattern, update the Isolation Forest score, log an anomaly record, and trigger an alert!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => handleTriggerAnomaly('high_light_unoccupied')}
              disabled={isTriggering}
              style={{ fontSize: '0.82rem' }}
            >
              <Zap size={15} color="#F59E0B" />
              Inject Unoccupied High Light
            </button>

            <button
              className="btn btn-danger"
              onClick={() => handleTriggerAnomaly('light_spike')}
              disabled={isTriggering}
              style={{ fontSize: '0.82rem' }}
            >
              <AlertTriangle size={15} />
              Inject Sensor Spike (990 ADC)
            </button>
          </div>
        </div>

        {triggerStatus && (
          <div style={{ 
            marginTop: '16px', 
            padding: '10px 14px', 
            borderRadius: '8px', 
            background: 'rgba(56, 189, 248, 0.1)', 
            border: '1px solid rgba(56, 189, 248, 0.25)',
            fontSize: '0.82rem',
            color: '#38BDF8'
          }}>
            {triggerStatus}
          </div>
        )}
      </div>

      {/* Detected Anomalies Table */}
      <div className="glass-card chart-card">
        <div className="chart-header">
          <div className="chart-title">
            <h3>Detected Unusual Patterns Log</h3>
            <p>Historical audit of environmental deviations flagged by ML and heuristic rules</p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={fetchAnomalies}
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Timestamp</th>
                <th>Observed Light</th>
                <th>Motion State</th>
                <th>Isolation Score</th>
                <th>Severity</th>
                <th>Diagnostic Description</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.length > 0 ? (
                anomalies.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{item.id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td><strong>{item.light_raw} ADC</strong></td>
                    <td>
                      <span style={{ 
                        color: item.motion === 1 ? '#F59E0B' : '#10B981', 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: item.motion === 1 ? '#F59E0B' : '#10B981' }} />
                        {item.motion === 1 ? 'Active' : 'Unoccupied'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: item.anomaly_score < 0 ? '#F43F5E' : '#94A3B8' }}>
                      {item.anomaly_score.toFixed(3)}
                    </td>
                    <td>
                      <span className={`badge ${item.severity === 'CRITICAL' ? 'badge-disconnected' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                        {item.severity}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {item.description}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No anomalous patterns detected yet. System operates within normal behavioral bounds.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
