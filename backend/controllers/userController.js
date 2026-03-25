const User = require('../models/User');
const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update profile details
exports.updateProfile = async (req, res) => {
  const { name, bio, profileImage } = req.body;
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.name = name || user.name;
    user.bio = bio !== undefined ? bio : user.bio;
    user.profileImage = profileImage || user.profileImage;

    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Helper for streak
const calculateStreak = (logs) => {
  if (!logs || logs.length === 0) return 0;
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

  if (uniqueDateStrings[0] !== today && uniqueDateStrings[0] !== yesterday && uniqueDateStrings[0] !== tomorrow) return 0;

  let streak = 1;
  let runner = new Date(uniqueDateStrings[0]);
  for (let i = 0; i < uniqueDateStrings.length - 1; i++) {
    runner.setDate(runner.getDate() - 1);
    const expected = getLocalDateStr(runner);
    if (uniqueDateStrings[i+1] === expected) streak++;
    else break;
  }
  return streak;
};

// Get user stats (total habits, completed habits, streaks, etc.)
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const habits = await Habit.find({ userId });
    const logs = await HabitLog.find({ userId, completed: true });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0,0,0,0);

    // Calculate days since user joined
    const joinedDate = new Date(user.joinedAt);
    joinedDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const daysSinceJoined = Math.max(1, Math.ceil((today - joinedDate) / (1000 * 60 * 60 * 24)));

    // Filter logs for the last 30 days (or since joined if less than 30 days)
    const effectiveStartDate = new Date(Math.max(thirtyDaysAgo.getTime(), joinedDate.getTime()));
    const logs30Days = logs.filter(l => new Date(l.date) >= effectiveStartDate);

    const totalHabits = habits.length;
    
    // Deduplicated count (one per habit per day)
    const uniqueCompletions = new Set(
        logs30Days.map(l => `${l.habitId.toString()}_${l.date}`)
    ).size;

    // Calculate total possible completions based on the effective window
    const effectiveWindowDays = Math.min(30, daysSinceJoined);
    const totalPossible = Math.max(totalHabits, 1) * effectiveWindowDays;
    const consistencyScore = Math.min(Math.round((uniqueCompletions / totalPossible) * 100), 100);

    // Calculate max current streak across all habits
    let maxStreak = 0;
    habits.forEach(h => {
        const habitLogs = logs.filter(l => l.habitId.toString() === h._id.toString());
        const s = calculateStreak(habitLogs);
        if (s > maxStreak) maxStreak = s;
    });

    const newLongest = Math.max(user.longestStreak || 0, maxStreak);
    if (maxStreak !== user.currentStreak || newLongest !== user.longestStreak) {
        user.currentStreak = maxStreak;
        user.longestStreak = newLongest;
        await user.save();
    }

    // Focus Area Distribution (Habit count per category)
    const categoryStats = {};
    habits.forEach(h => {
        const cat = h.category || 'General';
        categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });

    res.json({
      name: user.name || 'User',
      email: user.email,
      bio: user.bio,
      profileImage: user.profileImage,
      joinedAt: user.joinedAt,
      categoryStats,
      stats: {
        totalHabits,
        completedHabits: uniqueCompletions,
        currentStreak: maxStreak,
        longestStreak: user.longestStreak,
        consistencyScore
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
