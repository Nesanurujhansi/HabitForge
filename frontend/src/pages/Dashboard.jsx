import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Flame, 
  TrendingUp, 
  Plus, 
  CheckCircle2, 
  Circle,
  Calendar,
  Zap,
  Layout
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { motion } from 'framer-motion';
import AIInsightsPanel from './AIInsightsPanel';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const { stats, chartData, habits, recentLogs } = data;

  const filteredChartData = timeframe === 'week' ? chartData.slice(-7) : chartData;

  const displayStats = [
    { title: 'Current Streak', value: `${stats.currentStreak} Days`, icon: <Flame className="text-orange-500" />, trend: 'Keep it going!' },
    { title: 'Habit Score', value: `${stats.completionRate}%`, icon: <TrendingUp className="text-success" />, trend: 'Last 7 days' },
    { title: 'Active Habits', value: stats.activeHabits, icon: <Layout className="text-primary" />, trend: 'Currently tracking' },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold font-heading text-text-primary">Welcome back, {user?.name?.split(' ')[0]}!</h2>
          <p className="text-text-secondary mt-1 text-lg">You have {habits.length} active habits to crush today.</p>
        </div>
        <button 
          onClick={() => navigate('/app/habits?create=true')}
          className="btn-primary flex items-center gap-2 py-3 px-6 shadow-lg shadow-primary/20"
        >
          <Plus size={20} /> Create New Habit
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {displayStats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-6 flex items-start justify-between border-none shadow-sm hover:shadow-md transition-shadow"
          >
            <div>
              <p className="text-sm text-text-secondary font-bold uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-3xl font-bold mt-2 tracking-tight">{stat.value}</h3>
              <p className={`text-xs mt-3 font-medium inline-block px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-50 text-text-secondary'}`}>{stat.trend}</p>
            </div>
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 card p-8 border-none shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="font-bold text-xl">Consistency Trajectory</h4>
              <p className="text-xs text-text-secondary mt-1">Your performance over the last {timeframe === 'week' ? '7' : '30'} days</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-border">
              <button 
                onClick={() => setTimeframe('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'week' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-primary'}`}
              >
                Week
              </button>
              <button 
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'month' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-primary'}`}
              >
                Month
              </button>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredChartData}>
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#F1F5F9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94A3B8' : '#64748B', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94A3B8' : '#64748B', fontSize: 11}} unit="%" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    color: isDarkMode ? '#F8FAFC' : '#0F172A'
                  }}
                  formatter={(value) => [`${value}%`, 'Completion']}
                />
                <Area 
                  type="monotone" 
                  dataKey="completion" 
                  stroke="#4F46E5" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorComp)" 
                  dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: isDarkMode ? '#1E293B' : '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Habits */}
        <div className="card p-8 border-none shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-bold text-xl">Today's Focus</h4>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
               <CheckCircle2 size={16} className="text-primary" />
            </div>
          </div>
          
          <div className="space-y-5 flex-1 overflow-y-auto pr-1">
            {habits.slice(0, 6).map((habit, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl transition-all group cursor-pointer border border-transparent hover:border-border ${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-gray-50/50 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm text-gray-300 group-hover:text-primary transition-colors ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                    <Circle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{habit.habitName}</p>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider font-medium mt-0.5">{habit.category}</p>
                  </div>
                </div>
                <div className="text-right">
                   <div className="flex items-center gap-1 text-orange-500 font-bold text-xs">
                     <Flame size={12} />
                     <span>{habit.currentStreak || 0}</span>
                   </div>
                </div>
              </div>
            ))}
            {habits.length === 0 && (
              <div className="text-center py-12">
                <Layout className="mx-auto mb-3 text-gray-300" size={32} />
                <p className="text-xs text-text-secondary italic">Start your journey by adding a habit.</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => navigate('/app/habits')}
            className={`w-full mt-8 py-4 rounded-2xl text-sm font-bold transition-all ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}`}
          >
            See All Habits
          </button>
        </div>
      </div>

      {/* AI Insights Section */}
      <AIInsightsPanel />
    </div>
  );
};

export default Dashboard;
