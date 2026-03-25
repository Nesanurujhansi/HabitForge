const mongoose = require('mongoose');
const User = require('./models/User');

const migrate = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/habitforge');
    console.log('Connected to MongoDB');

    // Update all users: set joinedAt from createdAt if not set
    const users = await User.find();
    for (const user of users) {
      if (!user.joinedAt) {
        user.joinedAt = user.createdAt || new Date();
        await user.save();
      }
    }
    console.log('✅ Migration complete: Users now have joinedAt dates.');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

migrate();
