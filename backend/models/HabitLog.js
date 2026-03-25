const mongoose = require('mongoose');

const HabitLogSchema = new mongoose.Schema({
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  completed: { type: Boolean, default: false },
  completionHour: { type: Number, default: null } // 0-23, captured for ML feature engineering
});

module.exports = mongoose.model('HabitLog', HabitLogSchema);
