const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  habitName: { type: String, required: true },
  category: { type: String, default: 'General' },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
  startDate: { type: Date, default: Date.now },
  reminderTime: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Habit', HabitSchema);
