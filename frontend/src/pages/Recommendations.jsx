import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Award, 
  Sun, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { api } from '../services/api';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [efficiencyData, setEfficiencyData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [recs, eff] = await Promise.all([
        api.getRecommendations(30),
        api.getEfficiencyScore(),
      ]);
      setRecommendations(recs);
      setEfficiencyData(eff);
    } catch (err) {
      console.error("Error loading recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const factors = efficiencyData?.factors || {};

  return (
    <div className="page-body">
      {/* Top Academic Disclaimer */}
      <div style={{ 
        padding: '14px 20px', 
        borderRadius: '10px', 
        background: 'rgba(56, 189, 248, 0.08)', 
        border: '1px solid rgba(56, 189, 248, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '0.84rem',
        color: '#7DD3FC'
      }}>
        <Info size={20} color="#38BDF8" style={{ flexShrink: 0 }} />
        <div>
          <strong>Academic Disclaimer:</strong> {efficiencyData?.disclaimer || 
          "This is a project-defined analytical score and should not be interpreted as a certified energy-efficiency rating."}
        </div>
      </div>

      {/* LumiSense Efficiency Score Hero Card */}
      <div className="glass-card" style={{ padding: '28px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 2fr)', gap: '28px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderRight: '1px solid var(--border-subtle)', paddingRight: '20px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            LumiSense Efficiency Score
          </span>
          <div style={{ 
            fontFamily: 'var(--font-heading)', 
            fontSize: '4.2rem', 
            fontWeight: 800, 
            lineHeight: 1.1, 
            margin: '10px 0',
            color: (efficiencyData?.score || 85) >= 80 ? '#10B981' : ((efficiencyData?.score || 85) >= 60 ? '#F59E0B' : '#F43F5E')
          }}>
            {efficiencyData?.score ?? '--'}
            <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}> / 100</span>
          </div>
          <span className={`badge ${(efficiencyData?.score || 85) >= 80 ? 'badge-connected' : 'badge-warning'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            {efficiencyData?.rating || 'Calculating...'}
          </span>
        </div>

        <div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '10px' }}>
            Diagnostic Factor Breakdown
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            The score evaluates the balance between room occupancy and lighting levels over the recent observation window:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.84rem' }}>
            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-muted)' }}>Unoccupied High Light Events:</div>
              <strong style={{ fontSize: '1.1rem', color: factors.unoccupied_high_light_instances > 0 ? '#F59E0B' : '#10B981' }}>
                {factors.unoccupied_high_light_instances ?? 0} instances
              </strong>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-muted)' }}>Occupancy Rate:</div>
              <strong style={{ fontSize: '1.1rem', color: '#38BDF8' }}>
                {factors.occupancy_rate_percent ?? 0}%
              </strong>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-muted)' }}>Wastage Pattern Deduction:</div>
              <strong style={{ fontSize: '1.1rem', color: factors.unoccupied_light_penalty > 0 ? '#F43F5E' : '#10B981' }}>
                -{factors.unoccupied_light_penalty ?? 0} pts
              </strong>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--text-muted)' }}>Anomaly Penalty:</div>
              <strong style={{ fontSize: '1.1rem', color: factors.anomaly_penalty > 0 ? '#F43F5E' : '#10B981' }}>
                -{factors.anomaly_penalty ?? 0} pts
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Advisory Recommendations Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Heuristic Energy-Saving & Comfort Advisories</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Generated suggestions based on real-time and historical behavioral patterns</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
          {recommendations.length > 0 ? (
            recommendations.map((rec) => (
              <div 
                key={rec.id} 
                className="glass-card" 
                style={{ 
                  padding: '20px', 
                  borderLeft: `4px solid ${rec.severity === 'WARNING' ? '#F59E0B' : '#38BDF8'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {rec.rule_code}
                    </span>
                    <span className={`badge ${rec.severity === 'WARNING' ? 'badge-warning' : 'badge-connected'}`} style={{ fontSize: '0.7rem' }}>
                      {rec.severity}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.96rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {rec.title}
                  </h4>

                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
                    {rec.message}
                  </p>
                </div>

                <div style={{ 
                  padding: '10px 14px', 
                  background: 'var(--bg-input)', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)'
                }}>
                  <ArrowRight size={14} color="#38BDF8" style={{ flexShrink: 0 }} />
                  <span><strong>Suggested Action:</strong> {rec.suggested_action}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              No active energy-saving advisories. Environmental conditions are within optimal parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
