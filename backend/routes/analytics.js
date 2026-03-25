const express = require('express');
const router = express.Router();
const HabitLog = require('../models/HabitLog');
const Habit = require('../models/Habit');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Flexible streak helper
const calculateStreak = (logs) => {
  if (!logs || logs.length === 0) return 0;
  
  // Unique YYYY-MM-DD strings of completions, newest first
  const uniqueDateStrings = Array.from(new Set(
    logs.filter(l => l.completed).map(l => l.date)
  )).sort((a, b) => b.localeCompare(a));

  if (uniqueDateStrings.length === 0) return 0;

  // Timezone-safe anchor check (within last 48 hours is 'active')
  const now = new Date();
  const latestLogDate = new Date(uniqueDateStrings[0]);
  const hoursSinceLast = Math.abs(now - latestLogDate) / (1000 * 60 * 60);
  
  if (hoursSinceLast > 48) return 0;

  // Count backwards
  let streak = 1;
  let runner = new Date(uniqueDateStrings[0]);
  const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  for (let i = 0; i < uniqueDateStrings.length - 1; i++) {
    runner.setDate(runner.getDate() - 1);
    const expected = formatDate(runner);
    if (uniqueDateStrings[i+1] === expected) streak++;
    else break;
  }
  return streak;
};

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const allLogs = await HabitLog.find({ userId, completed: true }).populate('habitId').sort({ date: -1 });
    const habits = await Habit.find({ userId });
    
    // 1. Effort Distribution
    const categoryCount = {};
    allLogs.forEach(log => {
       const category = log.habitId ? log.habitId.category : 'General';
       categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const effortData = Object.keys(categoryCount).map(key => ({
       name: key,
       value: categoryCount[key]
    }));

    // 2. 30-Day Trend (Deduplicated)
    const trendData = [];
    const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0,0,0,0);

    for(let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = formatDate(d);
        
        // Only count one completion per habit per day
        const uniqueHabitsThisDay = new Set(
          allLogs.filter(l => l.date === dStr).map(l => l.habitId ? l.habitId._id.toString() : null).filter(Boolean)
        );
        trendData.push({ date: dStr, completed: uniqueHabitsThisDay.size });
    }

    // 3. Max Streak
    let maxStreak = 0;
    habits.forEach(h => {
        const habitLogs = allLogs.filter(l => l.habitId && l.habitId._id.toString() === h._id.toString());
        const s = calculateStreak(habitLogs);
        if (s > maxStreak) maxStreak = s;
    });

    // 4. Mathematically Sound Consistency (Deduplicated)
    const uniqueHabitDatePairs = new Set(
      allLogs.filter(l => new Date(l.date) >= thirtyDaysAgo)
             .map(l => `${l.habitId ? l.habitId._id.toString() : 'gen'}_${l.date}`)
    ).size;

    const totalPossible = Math.max(habits.length, 1) * 30;
    const consistencyScore = Math.min(Math.round((uniqueHabitDatePairs / totalPossible) * 100), 100);

    // Growth Velocity
    const curWeek = trendData.slice(-7).reduce((a, b) => a + b.completed, 0);
    const prevWeek = trendData.slice(-14, -7).reduce((a, b) => a + b.completed, 0);
    const growth = prevWeek === 0 ? (curWeek > 0 ? 100 : 0) : Math.round(((curWeek - prevWeek) / prevWeek) * 100);

    res.json({ 
      effortData, 
      trendData,
      stats: {
        longestStreak: req.user.longestStreak || 0, // Fallback to user model for global record
        currentStreak: maxStreak,
        consistencyScore,
        goalProgress: growth
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
