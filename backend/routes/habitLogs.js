const express = require('express');
const router = express.Router();
const HabitLog = require('../models/HabitLog');
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

// @route   GET api/habitlogs
// @desc    Get all logs for current user
router.get('/', auth, async (req, res) => {
  try {
    const logs = await HabitLog.find({ userId: req.user.id });
    res.json(logs);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   POST api/habitlogs
// @desc    Toggle habit completion for a date
router.post('/', auth, async (req, res) => {
  const { habitId, date, completed } = req.body;
  try {
    let log = await HabitLog.findOne({ habitId, date });
    if (log) {
      log.completed = completed;
      await log.save();
    } else {
      log = new HabitLog({ habitId, userId: req.user.id, date, completed });
      await log.save();
    }
    res.json(log);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
