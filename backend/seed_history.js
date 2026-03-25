const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Habit = require('./models/Habit');
const HabitLog = require('./models/HabitLog');

const seedData = async () => {
  try {
    // 1. Connect to Atlas
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB Atlas Cloud');

    // 2. Find your newest user
    const user = await User.findOne().sort({ _id: -1 });
    if (!user) {
      console.log('❌ No users found! Please register an account on Vercel first.');
      process.exit(1);
    }
    console.log(`👤 Seeding history for user: ${user.email} (${user._id})`);

    // 3. Clear existing habits/logs for this user for a clean slate
    await Habit.deleteMany({ userId: user._id });
    await HabitLog.deleteMany({ userId: user._id });

    // 4. Create 3 new Habits
    const habitsToInsert = [
      { habitName: 'Morning Run (5km)', category: 'Health', frequency: 'daily', userId: user._id },
      { habitName: 'Read 20 Pages', category: 'Learning', frequency: 'daily', userId: user._id },
      { habitName: 'Deep Work (2 hrs)', category: 'Productivity', frequency: 'daily', userId: user._id }
    ];

    const insertedHabits = await Habit.insertMany(habitsToInsert);

    // 5. Time Travel: Create 14 days of backdated logs!
    const logs = [];
    const today = new Date();
    
    // We iterate over the past 14 days
    for (let i = 14; i >= 0; i--) {
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - i);
      
      const dateString = pastDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      // Generate random logs for each habit to make the ML charts look extremely dynamic
      insertedHabits.forEach(habit => {
        // 70% chance they completed it
        if (Math.random() > 0.3) {
          logs.push({
            habitId: habit._id,
            userId: user._id,
            date: dateString,
            completed: true,
            // Add a random morning/afternoon hour for the ML feature engineering
            completionHour: Math.floor(Math.random() * (17 - 7 + 1)) + 7 // e.g., 7 AM to 5 PM
          });
        }
      });
    }

    // 6. Save to Atlas
    await HabitLog.insertMany(logs);
    console.log(`🚀 Successfully injected ${logs.length} historical tracking logs into MongoDB Atlas!`);
    
    // Disconnect
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
