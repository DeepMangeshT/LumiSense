import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Activity, 
  Sun, 
  ShieldAlert, 
  Info 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { api } from '../services/api';

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('24h');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (tf) => {
    setLoading(true);
    try {
      const data = await api.getAnalytics(tf);
      setAnalyticsData(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe]);

  const stats = analyticsData?.light_stats || { avg: 0, min: 0, max: 0, std: 0 };
  const motionStats = analyticsData?.motion_stats || { active_percentage: 0, active_count: 0, inactive_count: 0 };
  const hourlyTrend = analyticsData?.hourly_trend || [];

  return (
    <div className="page-body">
      {/* Timeframe Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>Historical Usage & Lighting Analytics</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aggregated environmental statistics and diurnal behavioral trends</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: '1h', label: 'Last 1 Hour' },
            { id: '24h', label: 'Last 24 Hours' },
            { id: '7d', label: 'Last 7 Days' },
            { id: 'all', label: 'All Records' },
          ].map((btn) => (
            <button
              key={btn.id}
              className={`pill-btn ${timeframe === btn.id ? 'active' : ''}`}
              onClick={() => setTimeframe(btn.id)}
              style={{ padding: '7px 14px', fontSize: '0.82rem' }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Academic Disclosure Banner */}
      <div style={{ 
        padding: '12px 18px', 
        borderRadius: '10px', 
        background: 'rgba(56, 189, 248, 0.08)', 
        border: '1px solid rgba(56, 189, 248, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '0.82rem',
        color: '#7DD3FC'
      }}>
        <Info size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Academic Disclosure:</strong> The metrics below illustrate relative light variations and occupancy frequency. 
          The system monitors contextual conditions and does NOT directly measure electrical kWh electricity consumption.
        </span>
      </div>

      {/* Aggregate Statistics Summary Grid */}
      <div className="stats-grid">
        <MetricCard
          title="Average Light Level"
          value={stats.avg}
          unit="ADC"
          subtext={`Std dev: ±${stats.std} units`}
          icon={Sun}
          accent="cyan"
        />

        <MetricCard
          title="Min / Max Light Level"
          value={`${stats.min} / ${stats.max}`}
          unit="ADC"
          subtext="Sensor ADC 10-bit range [0, 1023]"
          icon={TrendingUp}
          accent="amber"
        />

        <MetricCard
          title="Occupancy Active Rate"
          value={`${motionStats.active_percentage}%`}
          subtext={`${motionStats.active_count} active / ${motionStats.inactive_count} idle samples`}
          icon={Activity}
          accent="emerald"
        />

        <MetricCard
          title="Telemetry Sample Count"
          value={analyticsData?.count?.toLocaleString() || 0}
          subtext={`Across selected ${timeframe} timeframe`}
          icon={Clock}
          accent="purple"
        />
      </div>

      {/* Hourly Diurnal Light Trend */}
      <div className="glass-card chart-card">
        <div className="chart-header">
          <div className="chart-title">
            <h3>Diurnal Solar & Room Lighting Trend</h3>
            <p>Average relative light level mapped by hour of the day</p>
          </div>
        </div>

        <div style={{ width: '100%', height: 300 }}>
          {hourlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrend}>
                <defs>
                  <linearGradient id="hourLightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 1023]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    borderColor: 'var(--border-strong)', 
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="avg_light" 
                  name="Avg Relative Light (ADC)" 
                  stroke="#38BDF8" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#hourLightGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              Insufficient telemetry points for hourly trend chart.
            </div>
          )}
        </div>
      </div>

      {/* Motion Activity & Predicted Demand Charts Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        
        {/* Hourly Motion Activity Distribution */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <h3>Occupancy Rate Distribution</h3>
              <p>Percentage of detected motion per hour interval</p>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            {hourlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} unit="%" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: 'var(--border-strong)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem'
                    }} 
                  />
                  <Bar dataKey="motion_rate" name="Motion Activity Rate (%)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No occupancy data available.
              </div>
            )}
          </div>
        </div>

        {/* Hourly Estimated Demand Trend */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <h3>Predicted Lighting Demand Trend</h3>
              <p>Model estimated demand requirements across the day</p>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            {hourlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} unit="%" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: 'var(--border-strong)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem'
                    }} 
                  />
                  <Bar dataKey="avg_demand" name="Estimated Demand (%)" fill="#A855F7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No demand estimation available.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
