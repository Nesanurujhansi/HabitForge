import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  User, Mail, Calendar, Camera, Save, 
  Flame, CheckCircle2, Layout, BarChart3, TrendingUp
} from 'lucide-react';
import {
  PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';

import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import { motion } from 'framer-motion';

const ProfilePage = () => {
  const { isDarkMode } = useTheme();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    profileImage: ''
  });

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  const fetchProfileAndStats = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        api.get('/api/user/profile'),
        api.get('/api/user/stats')
      ]);

      setProfile(profileRes.data);
      setStats(statsRes.data);
      setFormData({
        name: profileRes.data.name,
        email: profileRes.data.email,
        bio: profileRes.data.bio || '',
        profileImage: profileRes.data.profileImage || ''
      });
    } catch (err) {
      console.error('Error fetching profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await api.put(
        '/api/user/profile/update',
        formData
      );
      setProfile(res.data);
      setEditMode(false);
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  const categoryData = stats?.categoryStats ? Object.entries(stats.categoryStats).map(([name, value]) => ({
    name, value
  })) : [];

  const displayStats = stats?.stats || {
    currentStreak: 0,
    completedHabits: 0,
    totalHabits: 0,
    consistencyScore: 0
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Profile Section */}
      <div className="relative">
        <div className="h-48 w-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
        
        <div className="px-8 -mt-16 flex flex-col md:flex-row items-end gap-6 relative z-10">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-white p-1.5 shadow-xl border border-white">
              <img 
                src={profile?.profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                alt="profile" 
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            {editMode && (
              <label className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-xl shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                <Camera size={16} />
              </label>
            )}
          </div>
          
          <div className="flex-1 mb-2">
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.name}</h2>
            <div className="flex items-center gap-4 mt-2 text-text-secondary">
              <span className="flex items-center gap-1.5 text-sm">
                <Mail size={14} /> {profile?.email}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Calendar size={14} /> Joined {new Date(profile?.joinedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="mb-2">
            <button 
              onClick={() => setEditMode(!editMode)}
              className={`px-6 py-2.5 border border-border rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 ${
                isDarkMode 
                  ? 'bg-slate-800 text-white hover:bg-slate-700' 
                  : (editMode ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' : 'bg-white text-gray-700 hover:bg-gray-50')
              }`}
            >
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Performance */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-5 text-center">
              <Flame className="mx-auto mb-2 text-orange-500" size={24} />
              <p className="text-2xl font-bold">{displayStats.currentStreak}</p>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Current Streak</p>
            </div>
            <div className="card p-5 text-center">
              <CheckCircle2 className="mx-auto mb-2 text-green-500" size={24} />
              <p className="text-2xl font-bold">{displayStats.completedHabits}</p>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Total Logs (30d)</p>
            </div>
            <div className="card p-5 text-center">
              <Layout className="mx-auto mb-2 text-blue-500" size={24} />
              <p className="text-2xl font-bold">{displayStats.totalHabits}</p>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Active Habits</p>
            </div>
            <div className="card p-5 text-center">
              <TrendingUp className="mx-auto mb-2 text-purple-500" size={24} />
              <p className="text-2xl font-bold">{displayStats.consistencyScore}%</p>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-1">Consistency</p>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold">Focus Area Distribution</h3>
                <p className="text-xs text-text-secondary">Habit count by category</p>
              </div>
              <BarChart3 className="text-text-secondary" size={20} />
            </div>
            
            <div className="h-[300px]">
              {categoryData.length > 0 ? (
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
                        <Cell key={`cell-${index}`} fill={['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                        color: isDarkMode ? '#F8FAFC' : '#0F172A'
                      }}
                      itemStyle={{ color: isDarkMode ? '#F8FAFC' : '#0F172A' }}
                    />
                    <Legend 
                      iconType="circle" 
                      wrapperStyle={{ 
                        paddingTop: '20px',
                        color: isDarkMode ? '#94A3B8' : '#64748B'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className={`h-full flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                  <Layout className="text-gray-300 mb-2" size={32} />
                  <p className="text-sm text-gray-400">No habit data available to show distribution.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Profile Form / Info */}
        <div className="space-y-8">
          <div className="card p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <User size={18} />
              {editMode ? 'General Settings' : 'Personal Info'}
            </h3>
            
            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-secondary mb-1 block">Display Name</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-4 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none ${isDarkMode ? 'bg-slate-800 text-white placeholder:text-slate-500' : 'bg-white text-gray-900'}`}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-secondary mb-1 block">Email Address</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-4 py-2 text-sm border border-border rounded-xl cursor-not-allowed ${isDarkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-gray-50 text-gray-500'}`}
                    disabled
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-secondary mb-1 block">Profile URL</label>
                  <input 
                    type="text"
                    value={formData.profileImage}
                    onChange={(e) => setFormData({...formData, profileImage: e.target.value})}
                    placeholder="Enter image URL"
                    className={`w-full px-4 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none ${isDarkMode ? 'bg-slate-800 text-white placeholder:text-slate-500' : 'bg-white text-gray-900'}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-secondary mb-1 block">Biography</label>
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className={`w-full px-4 py-2 text-sm border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none h-24 ${isDarkMode ? 'bg-slate-800 text-white placeholder:text-slate-500' : 'bg-white text-gray-900'}`}
                    placeholder="Tell us about your goals..."
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={updating}
                  className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <><Save size={18} /> Save Changes</>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-secondary mb-1 block">Member Since</label>
                  <p className="font-medium">{new Date(profile?.joinedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-secondary mb-1 block">Biography</label>
                  <p className="text-sm text-text-secondary italic">
                    {profile?.bio || 'No bio provided. Click edit to tell us about your journey.'}
                  </p>
                </div>
                <div className="pt-4 border-t border-border mt-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-text-secondary">Progress to Mastery</span>
                    <span className="font-bold text-primary">Level 8</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[65%]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
            <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-900'}`}>Consistency Tip</h4>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-indigo-300/80' : 'text-indigo-700'}`}>
              Research shows that completing a habit at the same time every day builds neural pathways 50% faster. Try anchoring your new habits to existing triggers!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
