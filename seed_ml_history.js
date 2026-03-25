/**
 * HabitForge — ML History Seeder
 * Generates 120 days of habit completion history for all users
 * ensuring that forecasts and predictions have data to work with.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./backend/models/User');
const Habit = require('./backend/models/Habit');
const HabitLog = require('./backend/models/HabitLog');

dotenv.config();

const seedMLHistory = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/habitforge');
    console.log('Connected to MongoDB');

    const users = await User.find();
    if (users.length === 0) {
      console.log('No users found. Run seeder.js or register a user first.');
      process.exit();
    }

    console.log(`Seeding history for ${users.length} users...`);

    const categories = ['Health', 'Work', 'Learning', 'Social', 'Personal'];
    const habitNames = [
      'Morning Meditation', 'Drink 2L Water', 'Read 20 Pages',
      'Daily 5km Run', 'Write Code', 'Learn Spanish',
      'Stretching', 'Journaling'
    ];

    for (const user of users) {
      console.log(`  - Processing user: ${user.name} (${user._id})`);

      // Ensure user has habits
      let habits = await Habit.find({ userId: user._id });
      if (habits.length === 0) {
        habits = [];
        for (let i = 0; i < 4; i++) {
          const h = new Habit({
            userId: user._id,
            habitName: habitNames[Math.floor(Math.random() * habitNames.length)],
            category: categories[Math.floor(Math.random() * categories.length)],
            frequency: 'daily',
            goal: 1,
            unit: 'sessions',
            startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)
          });
          await h.save();
          habits.push(h);
        }
      }

      // Generate logs for 120 days
      const logs = [];
      for (let day = 0; day < 120; day++) {
        const dateObj = new Date();
        dateObj.setDate(dateObj.getDate() - day);
        const dateStr = dateObj.toISOString().split('T')[0];

        // Ensure no duplicate logs for this date
        await HabitLog.deleteMany({ userId: user._id, date: dateStr });

        for (const habit of habits) {
          // 70% chance of completion generally, but with some "streakiness"
          const probability = 0.7 + (Math.sin(day / 5) * 0.2); // Seasonal/weekly pattern
          const completed = Math.random() < probability;

          logs.push({
            userId: user._id,
            habitId: habit._id,
            date: dateStr,
            completed: completed,
            completionHour: completed ? Math.floor(7 + Math.random() * 12) : null
          });
        }

        // Batch insert every 20 days to keep memory low
        if (logs.length > 100) {
          await HabitLog.insertMany(logs);
          logs.length = 0;
        }
      }
      if (logs.length > 0) {
        await HabitLog.insertMany(logs);
      }
    }

    console.log('✅ ML History Seeded successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedMLHistory();
