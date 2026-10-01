/**
 * Centralized API client for LumiSense Frontend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function fetchJSON(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`[API] Error on ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  // System & Health
  getHealth: () => fetchJSON('/health'),
  getSystemStatus: () => fetchJSON('/status'),
  getSerialPorts: () => fetchJSON('/serial/ports'),
  updateSettings: (payload) => fetchJSON('/settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  // Telemetry & Sensors
  getLatestReading: () => fetchJSON('/sensors/latest'),
  getHistory: (limit = 60, hours = null) => {
    let url = `/sensors/history?limit=${limit}`;
    if (hours) url += `&hours=${hours}`;
    return fetchJSON(url);
  },
  getAnalytics: (timeframe = '24h') => fetchJSON(`/sensors/analytics?timeframe=${timeframe}`),

  // Machine Learning
  getMLStatus: () => fetchJSON('/ml/status'),
  trainModel: (payload = { include_simulated_data: true }) => fetchJSON('/ml/train', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getPrediction: () => fetchJSON('/ml/prediction'),
  getAnomalies: (limit = 30) => fetchJSON(`/ml/anomalies?limit=${limit}`),
  triggerAnomaly: (type = 'high_light_unoccupied') => fetchJSON(`/ml/anomalies/trigger?anomaly_type=${type}`, {
    method: 'POST',
  }),

  // Recommendations & Efficiency
  getRecommendations: (limit = 20) => fetchJSON(`/recommendations?limit=${limit}`),
  getEfficiencyScore: () => fetchJSON('/recommendations/score'),

  // Simulation
  startSimulation: () => fetchJSON('/simulation/start', { method: 'POST' }),
  stopSimulation: () => fetchJSON('/simulation/stop', { method: 'POST' }),
  getSimulationStatus: () => fetchJSON('/simulation/status'),
};
