import React, { useState, useEffect } from 'react';

import { Brain, TrendingUp, Zap, ChevronRight, RefreshCw, Activity, Target } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

const AIInsightsPage = () => {
  const { isDarkMode } = useTheme();
  const [predictions, setPredictions] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [mlHealth, setMlHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllMLData();
  }, []);

  const fetchAllMLData = async () => {
    try {
      // Health check
      const healthRes = await api.get('/api/ml/health');
      setMlHealth(healthRes.data);

      if (healthRes.data.status === 'ml_service_offline') {
        setLoading(false);
        return;
      }

      // Fetch predictions and forecast
      const [predRes, forecastRes] = await Promise.allSettled([
        api.get('/api/ml/predict-all'),
        api.get('/api/ml/forecast'),
      ]);

      if (predRes.status === 'fulfilled') {
        setPredictions(predRes.value.data.predictions || []);
      }
      if (forecastRes.status === 'fulfilled' && forecastRes.value.data.forecast) {
        setForecast(forecastRes.value.data.forecast);
      }
    } catch (err) {
      console.error('ML fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllMLData();
    setRefreshing(false);
  };

  // Compute summary stats
  const avgProbability = predictions.length > 0
    ? predictions.reduce((s, p) => s + (p.probability || 0.5), 0) / predictions.length
    : 0;
  const likelyCount = predictions.filter(p => p.prediction === 'will_complete').length;
  const atRiskCount = predictions.filter(p => p.prediction === 'will_miss').length;
  const avgForecastScore = forecast.length > 0
    ? forecast.reduce((s, f) => s + f.predicted_score, 0) / forecast.length
    : 0;

  // ── ML Service Offline ──────────────────────────────────────────────────
  if (!loading && mlHealth?.status === 'ml_service_offline') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold font-heading text-text-primary">AI Insights</h2>
          <p className="text-text-secondary mt-1">Machine learning predictions and forecasts.</p>
        </div>
        <div className="card p-12 text-center">
          <div className={`w-16 h-16 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <Brain className="text-gray-400" size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2 text-text-primary">ML Engine Offline</h3>
          <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
            The AI prediction engine is taking a breather. Start it to unlock high-precision habit forecasts and behavioral insights.
          </p>
          <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'} rounded-xl p-4 max-w-sm mx-auto border border-border`}>
            <p className="text-xs font-mono text-text-secondary">
              <span className="text-primary font-bold">$</span> cd ml && python api.py
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold font-heading text-text-primary">AI Insights</h2>
          <p className="text-text-secondary mt-1">Loading ML predictions...</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
              <div className="h-8 bg-gray-100 rounded w-16"></div>
            </div>
          ))}
        </div>
        <div className="card p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="h-48 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold font-heading text-text-primary">AI Insights</h2>
          <p className="text-text-secondary mt-1">Machine learning predictions and consistency forecasts.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Predictions'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'} rounded-xl flex items-center justify-center`}>
              <Brain className="text-primary" size={20} />
            </div>
            <span className="text-xs text-text-secondary font-medium">Avg Probability</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{Math.round(avgProbability * 100)}%</p>
          <p className="text-[10px] text-text-secondary mt-1 uppercase tracking-wider">Completion Chance</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'} rounded-xl flex items-center justify-center`}>
              <Target className="text-success" size={20} />
            </div>
            <span className="text-xs text-text-secondary font-medium">On Track</span>
          </div>
          <p className="text-3xl font-bold text-success">{likelyCount}</p>
          <p className="text-[10px] text-text-secondary mt-1 uppercase tracking-wider">Habits Likely</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 ${isDarkMode ? 'bg-red-500/10' : 'bg-red-50'} rounded-xl flex items-center justify-center`}>
              <Activity className="text-red-500" size={20} />
            </div>
            <span className="text-xs text-text-secondary font-medium">At Risk</span>
          </div>
          <p className="text-3xl font-bold text-red-500">{atRiskCount}</p>
          <p className="text-[10px] text-text-secondary mt-1 uppercase tracking-wider">Need Attention</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50'} rounded-xl flex items-center justify-center`}>
              <TrendingUp className="text-amber-500" size={20} />
            </div>
            <span className="text-xs text-text-secondary font-medium">Forecast Avg</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{Math.round(avgForecastScore * 100)}%</p>
          <p className="text-[10px] text-text-secondary mt-1 uppercase tracking-wider">Next 7 Days</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Habit Predictions Card ───────────────────────────────────────── */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'} rounded-xl flex items-center justify-center`}>
                <Brain className="text-primary" size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-text-primary">Habit Completion Predictions</h4>
                <p className="text-[10px] text-text-secondary">Will you complete these today?</p>
              </div>
            </div>
            <span className="text-[10px] bg-success/10 text-success font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Live
            </span>
          </div>

          {predictions.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {predictions.map((pred, i) => (
                <div key={pred.habitId || i} className={`flex items-center gap-4 p-3 rounded-xl transition-colors border border-transparent hover:border-border ${isDarkMode ? 'bg-background hover:bg-slate-800' : 'bg-gray-50 hover:bg-gray-100'}`}>
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

                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold truncate text-text-primary">{pred.habitName}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        pred.prediction === 'will_complete'
                          ? 'bg-success/10 text-success'
                          : pred.prediction === 'will_miss'
                          ? 'bg-red-50 text-red-500'
                          : 'bg-gray-100 text-text-secondary'
                      }`}>
                        {pred.prediction === 'will_complete' ? '✓ Likely' :
                         pred.prediction === 'will_miss' ? '✗ At Risk' : '— Unknown'}
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
            <div className="text-center py-12">
              <Zap className="mx-auto mb-3 text-gray-300" size={32} />
              <p className="text-sm text-text-secondary italic">
                Add habits and log completions to see AI predictions.
              </p>
            </div>
          )}
        </div>

        {/* ── Prediction Probability Bar Chart ─────────────────────────────── */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 ${isDarkMode ? 'bg-violet-500/10' : 'bg-violet-50'} rounded-xl flex items-center justify-center`}>
              <Zap className="text-violet-500" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary">Prediction Breakdown</h4>
              <p className="text-[10px] text-text-secondary">Completion probability per habit</p>
            </div>
          </div>

          {predictions.length > 0 ? (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={predictions.map(p => ({
                  name: (p.habitName || 'Habit').length > 12
                    ? (p.habitName || 'Habit').substring(0, 12) + '…'
                    : (p.habitName || 'Habit'),
                  probability: Math.round((p.probability || 0.5) * 100),
                  fill: (p.probability || 0.5) >= 0.7 ? '#22C55E' : (p.probability || 0.5) >= 0.4 ? '#F59E0B' : '#EF4444',
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f0f0f0'} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDarkMode ? '#94A3B8' : '#64748B' }} angle={-20} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: isDarkMode ? '#94A3B8' : '#64748B' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Probability']}
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
                  <Bar dataKey="probability" radius={[8, 8, 0, 0]}>
                    {predictions.map((p, i) => (
                      <Cell
                        key={i}
                        fill={(p.probability || 0.5) >= 0.7 ? '#22C55E' : (p.probability || 0.5) >= 0.4 ? '#F59E0B' : '#EF4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="mx-auto mb-3 text-gray-300" size={32} />
              <p className="text-sm text-text-secondary italic">No prediction data available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 7-Day Consistency Forecast (Full Width) ────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'} rounded-xl flex items-center justify-center`}>
              <TrendingUp className="text-success" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-text-primary">7-Day Consistency Forecast</h4>
              <p className="text-[10px] text-text-secondary">AI-predicted performance trajectory with confidence bands</p>
            </div>
          </div>
          {forecast.length > 0 && (
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              {/* Show model type from meta if available */}
              AI Forecast
            </span>
          )}
        </div>

        {forecast.length > 0 ? (
          <>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast.map(f => ({
                  date: new Date(f.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                  score: Math.round(f.predicted_score * 100),
                  upper: Math.round(f.upper_bound * 100),
                  lower: Math.round(f.lower_bound * 100),
                }))}>
                  <defs>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f0f0f0'} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDarkMode ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: isDarkMode ? '#94A3B8' : '#64748B' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, name === 'score' ? 'Predicted' : name === 'upper' ? 'Upper Bound' : 'Lower Bound']}
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
                  <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confBand)" />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" />
                  <Area
                    type="monotone" dataKey="score"
                    stroke="#4F46E5" strokeWidth={2.5}
                    fill="url(#forecastGrad)"
                    dot={{ fill: '#4F46E5', r: 4, strokeWidth: 2, stroke: isDarkMode ? '#1E293B' : '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: isDarkMode ? '#1E293B' : '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Forecast Table */}
            <div className={`mt-6 overflow-hidden rounded-xl border ${isDarkMode ? 'border-slate-800' : 'border-border'}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}>
                    <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Date</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Predicted Score</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Confidence Range</th>
                    <th className="text-center px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((f, i) => (
                    <tr key={i} className={`border-t transition-colors ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-border hover:bg-gray-50'}`}>
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {new Date(f.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-text-primary">
                        {Math.round(f.predicted_score * 100)}%
                      </td>
                      <td className="px-4 py-3 text-center text-text-secondary text-xs">
                        {Math.round(f.lower_bound * 100)}% – {Math.round(f.upper_bound * 100)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                          f.predicted_score >= 0.7 ? 'bg-success/10 text-success' :
                          f.predicted_score >= 0.4 ? (isDarkMode ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600') :
                          (isDarkMode ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-500')
                        }`}>
                          {f.predicted_score >= 0.7 ? 'Strong' : f.predicted_score >= 0.4 ? 'Moderate' : 'Weak'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="mx-auto mb-3 text-gray-300" size={32} />
            <p className="text-sm text-text-secondary italic mb-2">
              No forecast data available yet.
            </p>
            <p className="text-xs text-text-secondary">
              The forecast model needs your habit completion history. Keep logging your habits daily!
            </p>
          </div>
        )}
      </div>

      {/* ── ML Service Status ──────────────────────────────────────────────── */}
      {mlHealth && (
        <div className="card p-6">
          <h4 className="font-bold text-sm mb-4 text-text-primary">ML Service Status</h4>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(mlHealth.models || {}).map(([name, status]) => (
              <div key={name} className={`flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'bg-background' : 'bg-gray-50'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'loaded' ? 'bg-success' : 'bg-gray-300'}`} />
                <div>
                  <p className="text-xs font-bold capitalize text-text-primary">{name}</p>
                  <p className="text-[10px] text-text-secondary capitalize">{status.replace('_', ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPage;
