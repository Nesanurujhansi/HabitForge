const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  bio: { type: String, default: '' },
  totalHabits: { type: Number, default: 0 },
  completedHabits: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
