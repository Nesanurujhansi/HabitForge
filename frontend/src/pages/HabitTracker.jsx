import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Circle,
  Flame
} from 'lucide-react';

import { useLocation, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

const HabitTracker = () => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [habits, setHabits] = useState([]);
  const [filteredHabits, setFilteredHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newHabit, setNewHabit] = useState({
    habitName: '',
    category: 'Health',
    frequency: 'daily',
    reminderTime: ''
  });

  useEffect(() => {
    fetchData();
    
    // Check if we should open modal automatically
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setShowModal(true);
    }
  }, [location]);

  useEffect(() => {
    const query = searchParams.get('search')?.toLowerCase() || '';
    if (query) {
      setFilteredHabits(habits.filter(h => 
        h.habitName.toLowerCase().includes(query) || 
        h.category.toLowerCase().includes(query)
      ));
    } else {
      setFilteredHabits(habits);
    }
  }, [habits, searchParams]);

  const fetchData = async () => {
    try {
      const [habitsRes, logsRes] = await Promise.all([
        api.get('/api/habits'),
        api.get('/api/habitlogs')
      ]);
      setHabits(habitsRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Error fetching habits');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/habits', newHabit);
      setShowModal(false);
      setNewHabit({ habitName: '', category: 'Health', frequency: 'daily', reminderTime: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to create habit');
    }
  };

  const getLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const toggleHabit = async (habitId) => {
    const today = getLocalDateStr();
    // Normalize log date for comparison - logs from server might be ISO strings or Date objects
    const existingLog = logs.find(l => {
      const logDate = new Date(l.date).toISOString().split('T')[0];
      return l.habitId === habitId && logDate === today;
    });
    
    const completed = existingLog ? !existingLog.completed : true;

    try {
      await api.post('/api/habitlogs', {
        habitId,
        date: today,
        completed
      });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle habit');
    }
  };

  const deleteHabit = async (id) => {
    if (!window.confirm('Delete this habit?')) return;
    try {
      await api.delete(`/api/habits/${id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete');
    }
  };

  const isCompletedToday = (habitId) => {
    const today = getLocalDateStr();
    return logs.some(l => {
       const logDate = new Date(l.date).toISOString().split('T')[0];
       return l.habitId === habitId && logDate === today && l.completed;
    });
  };

  const calculateStreak = (habitId) => {
    const habitLogs = logs.filter(l => l.habitId === habitId && l.completed);
    if (!habitLogs.length) return 0;
    
    // Normalize to unique local dates
    const uniqueDates = Array.from(new Set(
      habitLogs.map(l => new Date(l.date).toISOString().split('T')[0])
    )).sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 0;
    const todayStr = getLocalDateStr();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    // Streak is only active if latest log is today or yesterday
    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;

    let checkDate = new Date(uniqueDates[0]);
    for (const d of uniqueDates) {
        const dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (d === dStr) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
  };

  if (loading) return <div>Loading your habits...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-heading">My Habits</h2>
          <p className="text-text-secondary mt-1">Manage your daily rituals and track your growth.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> New Habit
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search habits..." 
            value={searchParams.get('search') || ''}
            onChange={(e) => setSearchParams({ search: e.target.value })}
            className={`w-full pl-10 pr-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/10 outline-none transition-all ${isDarkMode ? 'bg-slate-800 text-text-primary placeholder:text-slate-500 focus:border-primary/50' : 'bg-white focus:border-primary'}`}
          />
        </div>
        <button className={`px-4 py-2 border border-border rounded-xl flex items-center gap-2 text-sm font-medium transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-white'}`}>
          <Filter size={18} /> Filters
        </button>
      </div>

      {/* Habits List */}
      <div className="grid gap-4">
        {filteredHabits.map((habit) => (
          <motion.div 
            layout
            key={habit._id}
            className="card p-5 group flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <button 
                onClick={() => toggleHabit(habit._id)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isCompletedToday(habit._id) 
                  ? 'bg-success text-white shadow-lg shadow-success/20' 
                  : isDarkMode ? 'bg-slate-800 text-slate-500 hover:bg-primary/20 hover:text-primary' : 'bg-gray-50 text-gray-300 hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {isCompletedToday(habit._id) ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
              
              <div>
                <h3 className={`font-bold text-lg text-text-primary ${isCompletedToday(habit._id) ? 'opacity-40 line-through' : ''}`}>
                  {habit.habitName}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded text-text-secondary ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                    {habit.category}
                  </span>
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <Calendar size={12} /> {habit.frequency}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center hidden md:block">
                <p className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">Streak</p>
                <div className="flex items-center gap-1 text-orange-500 font-bold">
                  <Flame size={14} /> {calculateStreak(habit._id)} Days
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className={`p-2 rounded-lg text-text-secondary ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => deleteHabit(habit._id)}
                  className={`p-2 rounded-lg text-red-500 ${isDarkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredHabits.length === 0 && (
          <div className={`text-center py-20 border-2 border-dashed border-border rounded-3xl ${isDarkMode ? 'bg-slate-900/50' : ''}`}>
            <div className={`w-16 h-16 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {new URLSearchParams(location.search).get('search') ? <Search className="text-text-secondary" /> : <Plus className="text-text-secondary" />}
            </div>
            <h3 className="font-bold text-lg">
              {new URLSearchParams(location.search).get('search') ? 'No habits found' : 'No habits yet'}
            </h3>
            <p className="text-text-secondary mb-6 italic">
              {new URLSearchParams(location.search).get('search') ? 'Try a different search query.' : 'Build your routine starting today.'}
            </p>
            {!new URLSearchParams(location.search).get('search') && (
              <button 
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Add First Habit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Habit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-border ${isDarkMode ? 'bg-slate-900 text-text-primary' : 'bg-white'}`}
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold font-heading mb-6 tracking-tight">Create New Habit</h3>
                <form onSubmit={handleCreateHabit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Habit Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Read for 30 mins"
                      className={`w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none ${isDarkMode ? 'bg-slate-800 text-text-primary placeholder:text-slate-500' : 'bg-gray-50'}`}
                      value={newHabit.habitName}
                      onChange={e => setNewHabit({...newHabit, habitName: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-text-primary">Category</label>
                      <select 
                        className={`w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none ${isDarkMode ? 'bg-slate-800 text-text-primary' : 'bg-gray-50'}`}
                        value={newHabit.category}
                        onChange={e => setNewHabit({...newHabit, category: e.target.value})}
                      >
                        <option>Health</option>
                        <option>Learning</option>
                        <option>Social</option>
                        <option>Mindset</option>
                        <option>Work</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-text-primary">Frequency</label>
                      <select 
                        className={`w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none ${isDarkMode ? 'bg-slate-800 text-text-primary' : 'bg-gray-50'}`}
                        value={newHabit.frequency}
                        onChange={e => setNewHabit({...newHabit, frequency: e.target.value})}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Reminder Time (Optional)</label>
                    <input 
                      type="time" 
                      className={`w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-mono ${isDarkMode ? 'bg-slate-800 text-text-primary' : 'bg-gray-50'}`}
                      value={newHabit.reminderTime}
                      onChange={e => setNewHabit({...newHabit, reminderTime: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className={`flex-1 py-3 border border-border rounded-xl font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-50'}`}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 btn-primary py-3"
                    >
                      Create Habit
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HabitTracker;
