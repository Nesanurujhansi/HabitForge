import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../api/axios';
import { Brain, TrendingUp, Zap, AlertTriangle, ChevronRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

/**
 * AIInsightsPanel — Dashboard component showing ML predictions & forecasts.
 * Displays:
 *   - Per-habit completion predictions with probability & confidence
 *   - 7-day consistency forecast chart
 */
import { useTheme } from '../context/ThemeContext';

const AIInsightsPanel = () => {
  const { isDarkMode } = useTheme();
  const [predictions, setPredictions] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [mlStatus, setMlStatus] = useState('checking');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMLData();
  }, []);

  const fetchMLData = async () => {
    try {
      // Check ML service health
      const healthRes = await api.get('/api/ml/health');
      if (healthRes.data.status === 'ml_service_offline') {
        setMlStatus('offline');
        setLoading(false);
        return;
      }
      setMlStatus('online');

      // Fetch predictions and forecast in parallel
      const [predRes, forecastRes] = await Promise.allSettled([
        api.get('/api/ml/predict-all'),
        api.get('/api/ml/forecast'),
      ]);

      if (predRes.status === 'fulfilled') {
        setPredictions(predRes.value.data.predictions || []);
      }
      if (forecastRes.status === 'fulfilled') {
        setForecast(forecastRes.value.data.forecast || []);
      }
    } catch {
      setMlStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  // ── Status: ML Service Offline ────────────────────────────────────────────
  if (mlStatus === 'offline') {
    return (
      <div className="card p-6 border border-dashed border-border">
        <div className="flex items-center gap-3 mb-3">
          <Brain className="text-text-secondary opacity-50" size={20} />
          <h4 className="font-bold text-sm text-text-secondary uppercase tracking-widest">AI Insights Offline</h4>
        </div>
        <p className="text-xs text-text-secondary italic">
          The ML Engine is taking a breather. Start it with: <code className={`${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'} px-1.5 py-0.5 rounded text-[10px] font-mono`}>cd ml && python api.py</code>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2 px-1">
        <h3 className="text-xl font-bold font-heading text-text-primary flex items-center gap-2">
          <Zap size={20} className="text-primary" />
          Predictive Insights
        </h3>
        <NavLink to="/app/ai-insights" className="text-xs text-primary font-bold hover:underline">
          View Detail Page
        </NavLink>
      </div>

      {/* ── Habit Predictions Card ───────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'} rounded-xl flex items-center justify-center`}>
              <Brain className="text-primary" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary">AI Habit Predictions</h4>
              <p className="text-[10px] text-text-secondary">Will you complete these today?</p>
            </div>
          </div>
          <span className="text-[10px] bg-success/10 text-success font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            Live
          </span>
        </div>

        {predictions.length > 0 ? (
          <div className="space-y-3">
            {predictions.map((pred, i) => (
              <div key={pred.habitId || i} className={`flex items-center gap-4 p-3 ${isDarkMode ? 'bg-background hover:bg-slate-800' : 'bg-gray-50 hover:bg-gray-100'} rounded-xl transition-colors border border-transparent hover:border-border`}>
                {/* Probability Ring */}
                <div className="relative w-12 h-12 flex-shrink-0">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="#e5e7eb" strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={pred.probability >= 0.7 ? '#22C55E' : pred.probability >= 0.4 ? '#F59E0B' : '#EF4444'}
                      strokeWidth="3"
                      strokeDasharray={`${(pred.probability || 0.5) * 100}, 100`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                    {Math.round((pred.probability || 0.5) * 100)}%
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold truncate">{pred.habitName}</h5>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      pred.prediction === 'will_complete'
                        ? 'bg-success/10 text-success'
                        : pred.prediction === 'will_miss'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-gray-100 text-text-secondary'
                    }`}>
                      {pred.prediction === 'will_complete' ? '✓ Likely' :
                       pred.prediction === 'will_miss' ? '✗ At Risk' : '? Unknown'}
                    </span>
                    <span className="text-[10px] text-text-secondary capitalize">
                      {pred.confidence || 'low'} confidence
                    </span>
                  </div>
                </div>

                <ChevronRight size={14} className="text-text-secondary" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-secondary italic text-center py-4">
            Add habits and log completions to see AI predictions.
          </p>
        )}
      </div>

      {/* ── Consistency Forecast ───────────────────────────────────────────── */}
      <div className="card p-6 min-h-[150px] flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'} rounded-xl flex items-center justify-center`}>
            <TrendingUp className="text-success" size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-text-primary">7-Day Consistency Forecast</h4>
            <p className="text-[10px] text-text-secondary">AI-predicted performance trajectory</p>
          </div>
        </div>

        {forecast.length > 0 ? (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast.map(f => ({
                date: new Date(f.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
                score: Math.round(f.predicted_score * 100),
                upper: Math.round(f.upper_bound * 100),
                lower: Math.round(f.lower_bound * 100),
              }))}>
                <defs>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f0f0f0'} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDarkMode ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: isDarkMode ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Score']}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none',
                    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                    color: isDarkMode ? '#F8FAFC' : '#0F172A',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px' 
                  }}
                  itemStyle={{ color: isDarkMode ? '#F8FAFC' : '#0F172A' }}
                />
                <Area type="monotone" dataKey="upper" stroke="none" fill="#4F46E5" fillOpacity={isDarkMode ? 0.05 : 0.08} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" />
                <Area
                  type="monotone" dataKey="score"
                  stroke="#4F46E5" strokeWidth={2.5}
                  fill="url(#forecastGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={`text-center py-4 rounded-2xl border border-dashed border-border mx-2 ${isDarkMode ? 'bg-background' : 'bg-gray-50'}`}>
            <TrendingUp className="mx-auto mb-2 text-gray-300" size={24} />
            <p className="text-[10px] text-text-secondary px-6">
               Not enough background data yet. Keep logging your habits for 7+ days to see your consistency forecast!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;
