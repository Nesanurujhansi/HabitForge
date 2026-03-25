const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const auth = require('../middleware/auth');

// Helper to calculate streak (Date-string based)
const calculateStreak = (logs) => {
  if (!logs || logs.length === 0) return 0;
  
  // Get unique completion dates (YYYY-MM-DD strings), sorted newest first
  const uniqueDateStrings = Array.from(new Set(
    logs.filter(l => l.completed).map(l => l.date)
  )).sort((a, b) => b.localeCompare(a));

  if (uniqueDateStrings.length === 0) return 0;

  const getLocalDateStr = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const today = getLocalDateStr(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = getLocalDateStr(tomorrowDate);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getLocalDateStr(yesterdayDate);

  // Streak is active if the most recent completion is Today, Yesterday, or Tomorrow (timezone safety)
  if (uniqueDateStrings[0] !== today && uniqueDateStrings[0] !== yesterday && uniqueDateStrings[0] !== tomorrow) return 0;

  let streak = 1;
  let runner = new Date(uniqueDateStrings[0]);
  for (let i = 0; i < uniqueDateStrings.length - 1; i++) {
    runner.setDate(runner.getDate() - 1);
    const expected = getLocalDateStr(runner);
    if (uniqueDateStrings[i+1] === expected) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

// @route   GET api/dashboard
// @desc    Get aggregated dashboard stats for a user
router.get('/', auth, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id });
    const logs = await HabitLog.find({ userId: req.user.id });
    
    const activeHabitsCount = habits.length;
    
    // Calculate global streak (max streak among all habits)
    let maxStreak = 0;
    const habitsWithStreaks = habits.map(habit => {
       const habitLogs = logs.filter(l => l.habitId.toString() === habit._id.toString());
       const streak = calculateStreak(habitLogs);
       if (streak > maxStreak) maxStreak = streak;
       return { ...habit.toObject(), currentStreak: streak };
    });

    // Calculate completion rate (last 7 days overall)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0,0,0,0);
    
    const recentLogs = logs.filter(l => new Date(l.date) >= sevenDaysAgo);
    let totalPossibleLogs = activeHabitsCount * 7;
    let completedLogsCount = recentLogs.filter(l => l.completed).length;
    
    let completionRate = totalPossibleLogs > 0 ? Math.round((completedLogsCount / totalPossibleLogs) * 100) : 0;

    // Generate chart data for last 30 days
    const chartData = [];
    const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0,0,0,0);
      
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const logsForDay = logs.filter(l => l.date === dateStr);
      const compCount = logsForDay.filter(l => l.completed).length;
      let dailyRate = activeHabitsCount > 0 ? Math.round((compCount / activeHabitsCount) * 100) : 0;
      
      chartData.push({
        name: i < 7 ? daysArr[date.getDay()] : `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`,
        completion: dailyRate,
        date: dateStr
      });
    }

    res.json({
      stats: {
        currentStreak: maxStreak,
        completionRate: completionRate,
        activeHabits: activeHabitsCount
      },
      chartData: chartData,
      habits: habitsWithStreaks,
      recentLogs: logs.slice(-10)
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
