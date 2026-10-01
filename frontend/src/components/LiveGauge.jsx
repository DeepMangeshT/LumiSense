import React from 'react';

export default function LiveGauge({ 
  value = 0, 
  min = 0, 
  max = 1023, 
  label = "Relative Light Level",
  color = "#38BDF8"
}) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  // Use a 240 degree arc gauge
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="170" height="150" viewBox="0 0 170 150">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          cx="85"
          cy="85"
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="11"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform="rotate(150 85 85)"
        />

        {/* Progress Arc */}
        <circle
          cx="85"
          cy="85"
          r={radius}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="11"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(150 85 85)"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />

        {/* Value Text */}
        <text 
          x="85" 
          y="80" 
          textAnchor="middle" 
          fill="var(--text-primary)" 
          fontSize="24" 
          fontWeight="800"
          fontFamily="var(--font-heading)"
        >
          {Math.round(value)}
        </text>

        <text 
          x="85" 
          y="100" 
          textAnchor="middle" 
          fill="var(--text-muted)" 
          fontSize="11" 
          fontWeight="500"
          fontFamily="var(--font-sans)"
        >
          / {max} ADC
        </text>
      </svg>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '-15px' }}>
        {label}
      </div>
    </div>
  );
}
