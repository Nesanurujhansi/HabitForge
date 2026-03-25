const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Group = require('./models/Group');
const Challenge = require('./models/Challenge');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/habitforge');
    
    console.log('Clearing existing data...');
    await Group.deleteMany({});
    await Challenge.deleteMany({});

    console.log('Seeding groups...');
    const groups = [
      {
        groupName: 'Healthy Habits',
        description: 'A community for those wanting to improve their physical and mental health.',
        privacy: 'public',
        adminId: new mongoose.Types.ObjectId() // Placeholder
      },
      {
        groupName: 'Code Every Day',
        description: 'Daily coding challenges and accountability for developers.',
        privacy: 'public',
        adminId: new mongoose.Types.ObjectId()
      },
      {
        groupName: 'Early Risers',
        description: 'Wake up early and win the morning!',
        privacy: 'public',
        adminId: new mongoose.Types.ObjectId()
      }
    ];
    await Group.insertMany(groups);

    console.log('Seeding challenges...');
    const challenges = [
      {
        title: '30 Days of Meditation',
        description: 'Meditate for at least 10 minutes every day.',
        duration: '30 Days',
      },
      {
        title: 'Morning Yoga',
        description: 'Complete a yoga session every morning.',
        duration: '14 Days',
      }
    ];
    await Challenge.insertMany(challenges);

    console.log('Seed successful!');
    process.exit();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seedData();
