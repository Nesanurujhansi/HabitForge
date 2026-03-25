const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Hash the simple password "123456"
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // Update the user
    const result = await User.updateOne(
      { email: 'john@gmail.com' },
      { $set: { password: hashedPassword } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Password successfully reset to: 123456');
    } else {
      console.log('⚠️ Could not find user with that email.');
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error resetting password:', err);
    process.exit(1);
  }
};

resetPassword();
