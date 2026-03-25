import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Calendar, Target, Award, Zap, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const AnalyticsPage = () => {
  const { isDarkMode } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/api/analytics');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) return <div className="p-8 text-text-secondary font-medium animate-pulse">Loading analytics...</div>;

  const categoryData = data.effortData && data.effortData.length > 0 ? data.effortData : [{ name: 'No Data', value: 1 }];
  
  const completionData = data.trendData ? data.trendData.slice(timeframe === 'week' ? -7 : -30).map(d => ({
     name: timeframe === 'week' 
      ? new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
      : new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
     completed: d.completed,
     total: d.total
  })) : [];
  
  const totalCompletionsThisMonth = data.trendData ? data.trendData.reduce((acc, curr) => acc + curr.completed, 0) : 0;

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#F43F5E'];

  const realStats = data.stats || {
    longestStreak: 0,
    consistencyScore: 0,
    goalProgress: 0,
    currentStreak: 0
  };

  const dashboardStats = [
    { label: 'Longest Streak', value: `${realStats.longestStreak} Days`, icon: <Zap className="text-orange-500" />, sub: 'All-time record' },
    { label: 'Consistency Score', value: `${realStats.consistencyScore}%`, icon: <Activity className="text-primary" />, sub: 'Last 30 days attainment' },
    { label: 'Total Completions', value: totalCompletionsThisMonth.toString(), icon: <Award className="text-success" />, sub: `Current Streak: ${realStats.currentStreak} Days` },
    { label: 'Growth Trend', value: `${realStats.goalProgress >= 0 ? '+' : ''}${realStats.goalProgress}%`, icon: <Target className="text-secondary" />, sub: 'Current vs Previous week' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-heading">Analytics Dashboard</h2>
        <p className="text-text-secondary mt-1">Deep dive into your journey and consistency patterns.</p>
      </div>

      {/* Mini Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        {dashboardStats.map((stat, i) => (
          <div key={i} className="card p-6 border-l-4 border-l-primary/30">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</h3>
            <p className="text-[10px] text-text-secondary mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Completion Bar Chart */}
        <div className="card p-8">
          <div className="flex justify-between items-center mb-8">
            <h4 className="font-bold text-lg">Habit Completion Volume</h4>
            <div className={`flex p-1 rounded-lg ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-gray-50 border border-gray-100'}`}>
              <button 
                onClick={() => setTimeframe('week')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeframe === 'week' 
                  ? (isDarkMode ? 'bg-slate-800 text-white shadow-lg shadow-black/20' : 'bg-white text-gray-700 shadow-sm shadow-primary/5') 
                  : 'text-text-secondary hover:text-text-primary'}`}
              >
                Week
              </button>
              <button 
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeframe === 'month' 
                  ? (isDarkMode ? 'bg-slate-800 text-white shadow-lg shadow-black/20' : 'bg-white text-gray-700 shadow-sm shadow-primary/5') 
                  : 'text-text-secondary hover:text-text-primary'}`}
              >
                Month
              </button>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#E2E8F0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94A3B8' : '#64748B', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94A3B8' : '#64748B', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: isDarkMode ? '#1E293B' : '#F8FAFC'}}
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    color: isDarkMode ? '#F8FAFC' : '#0F172A'
                  }}
                  itemStyle={{ color: isDarkMode ? '#F8FAFC' : '#0F172A' }}
                />
                <Bar dataKey="completed" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="card p-8">
          <h4 className="font-bold text-lg mb-8">Effort Distribution</h4>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: '12px', 
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    color: isDarkMode ? '#F8FAFC' : '#0F172A'
                  }}
                  itemStyle={{ color: isDarkMode ? '#F8FAFC' : '#0F172A' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4 pl-4 pr-12">
              {categoryData.filter(c => c.name !== 'No Data').map((cat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-sm font-bold">{cat.name}</span>
                  <span className="text-xs text-text-secondary">{cat.value} completions</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="card p-8 bg-slate-900 text-white border-0">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h4 className="font-bold text-xl">Consistency Trends</h4>
            <p className="text-slate-400 text-sm mt-1">Measuring your focus over the last 6 months.</p>
          </div>
          <Calendar size={24} className="text-primary opacity-50" />
        </div>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trendData && data.trendData.length > 0 ? data.trendData.map(d => ({
              m: new Date(d.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
              val: d.completed
            })) : []}>
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }}
              />
              <Area type="monotone" dataKey="val" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
