import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Cpu, 
  Sliders, 
  Zap, 
  Info,
  Layers,
  Database
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { api } from '../services/api';

export default function Predictions() {
  const [mlStatus, setMlStatus] = useState(null);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [includeSimulated, setIncludeSimulated] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchMLData = async () => {
    try {
      const [status, pred] = await Promise.all([
        api.getMLStatus(),
        api.getPrediction().catch(() => null),
      ]);
      setMlStatus(status);
      if (pred) setCurrentPrediction(pred);
    } catch (err) {
      console.error("Error loading ML status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMLData();
    const interval = setInterval(fetchMLData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainResult(null);
    try {
      const res = await api.trainModel({ include_simulated_data: includeSimulated });
      setTrainResult({ success: true, ...res });
      await fetchMLData();
    } catch (err) {
      setTrainResult({ success: false, message: err.message });
    } finally {
      setIsTraining(false);
    }
  };

  const getReadinessBadge = (state) => {
    switch (state) {
      case 'READY':
        return <span className="badge badge-connected"><CheckCircle2 size={12} /> Ready for Training</span>;
      case 'EARLY_EXPERIMENTATION':
        return <span className="badge badge-warning"><AlertCircle size={12} /> Early Experimentation</span>;
      default:
        return <span className="badge badge-disconnected"><AlertCircle size={12} /> Insufficient Data</span>;
    }
  };

  const metadata = mlStatus?.model_metadata?.metadata || {};
  const mae = mlStatus?.model_metadata?.mae;
  const rmse = mlStatus?.model_metadata?.rmse;
  const r2 = mlStatus?.model_metadata?.r2;

  return (
    <div className="page-body">
      {/* Top Academic Disclaimer */}
      <div style={{ 
        padding: '14px 20px', 
        borderRadius: '10px', 
        background: 'rgba(168, 85, 247, 0.1)', 
        border: '1px solid rgba(168, 85, 247, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '0.84rem',
        color: '#E9D5FF'
      }}>
        <Info size={20} color="#C084FC" style={{ flexShrink: 0 }} />
        <div>
          <strong>Technical Clarification:</strong> The target variable predicted by this system is 
          <strong> Estimated Lighting Demand (%)</strong>, based on environmental light and room occupancy. 
          It estimates required artificial lighting levels and does <em>not</em> claim to measure electrical kWh power consumption.
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <MetricCard
          title="Current Lighting Demand"
          value={currentPrediction ? `${Math.round(currentPrediction.predicted_demand)}%` : '--'}
          subtext="Real-time regression forecast"
          icon={Zap}
          accent="purple"
          badgeText="LIVE ESTIMATE"
        />

        <MetricCard
          title="Active Model"
          value={mlStatus?.demand_model_trained ? "Random Forest" : "Heuristic Rule"}
          subtext={mlStatus?.demand_model_trained ? "80 Decision Trees Regressor" : "Fallback until trained"}
          icon={Cpu}
          accent="cyan"
          badgeText={mlStatus?.demand_model_trained ? "TRAINED" : "BASELINE"}
        />

        <MetricCard
          title="Validation R² Score"
          value={r2 !== null && r2 !== undefined ? r2 : "--"}
          subtext="Coefficient of determination"
          icon={CheckCircle2}
          accent="emerald"
          badgeText="ACCURACY"
        />

        <MetricCard
          title="Test MAE / RMSE"
          value={mae !== null && mae !== undefined ? `±${mae}%` : "--"}
          subtext={rmse ? `Root MSE: ±${rmse}%` : "Awaiting training"}
          icon={Sliders}
          accent="amber"
          badgeText="ERROR BOUND"
        />
      </div>

      {/* Main Training and Feature Pipeline Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.6fr)', gap: '24px' }}>
        
        {/* Model Training Control Card */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <h3>Model Training Console</h3>
              <p>Retrain Random Forest Regressor & Isolation Forest</p>
            </div>
            {getReadinessBadge(mlStatus?.readiness_state)}
          </div>

          <div style={{ marginBottom: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <p>{mlStatus?.message}</p>
          </div>

          {/* Dataset Composition Stats */}
          <div style={{ 
            background: 'var(--bg-input)', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid var(--border-subtle)',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Records Available:</span>
              <strong>{mlStatus?.total_records?.toLocaleString() || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Real Hardware Sensor Records:</span>
              <strong style={{ color: '#10B981' }}>{mlStatus?.real_records_count?.toLocaleString() || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Simulated / Demo Records:</span>
              <strong style={{ color: '#C084FC' }}>{mlStatus?.simulated_records_count?.toLocaleString() || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Data Mix in Active Model:</span>
              <span style={{ fontStyle: 'italic' }}>{metadata.mix || 'Pre-seeded demo dataset'}</span>
            </div>
          </div>

          {/* Training Options */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem' }}>
              <input
                type="checkbox"
                checked={includeSimulated}
                onChange={(e) => setIncludeSimulated(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>Include simulated dataset (Recommended for academic demo until 500+ real readings are collected)</span>
            </label>
          </div>

          {/* Action Button */}
          <button
            className="btn btn-primary"
            onClick={handleTrainModel}
            disabled={isTraining || mlStatus?.readiness_state === 'INSUFFICIENT_DATA'}
            style={{ width: '100%', padding: '12px', fontSize: '0.92rem' }}
          >
            {isTraining ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Training Machine Learning Pipeline...</span>
              </>
            ) : (
              <>
                <BrainCircuit size={18} />
                <span>Train / Retrain Models</span>
              </>
            )}
          </button>

          {/* Training Result Notification */}
          {trainResult && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              borderRadius: '8px', 
              fontSize: '0.82rem',
              background: trainResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${trainResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              color: trainResult.success ? '#6EE7B7' : '#FDA4AF'
            }}>
              <div><strong>{trainResult.success ? '✓ Training Succeeded' : '✗ Training Failed'}</strong></div>
              <div>{trainResult.message}</div>
              {trainResult.mae && <div>MAE: ±{trainResult.mae}% | RMSE: ±{trainResult.rmse}% | R²: {trainResult.r2}</div>}
            </div>
          )}
        </div>

        {/* Feature Engineering & Architecture Card */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <h3>Feature Pipeline & Pipeline Architecture</h3>
              <p>Temporal, rolling, and lag features computed without data leakage</p>
            </div>
            <Layers size={18} color="#38BDF8" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.86rem' }}>
            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                1. Temporal Features (Circadian Context)
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <code>hour</code>, <code>minute</code>, <code>day_of_week</code>, <code>is_weekend</code> (captures natural solar cycles and schedule rhythms).
              </p>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, color: '#F59E0B', marginBottom: '4px' }}>
                2. Environmental & Occupancy Features
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <code>light_smoothed</code> (moving average), <code>motion</code> (binary PIR), and optional <code>temperature</code>/<code>humidity</code> once DHT11 is added.
              </p>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, color: '#A855F7', marginBottom: '4px' }}>
                3. Rolling & Lag Dynamics (Window = 5 samples)
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <code>rolling_light_mean</code>, <code>rolling_motion_sum</code>, <code>light_lag_1</code>, <code>motion_lag_1</code>.
              </p>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, color: '#10B981', marginBottom: '4px' }}>
                4. Anomaly Detection Engine
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Unsupervised <strong>Isolation Forest</strong> trained to identify anomalous multi-dimensional sensor configurations (e.g. blazing light with zero motion at 2:00 AM).
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
