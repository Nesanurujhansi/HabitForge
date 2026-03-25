const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

// @route   GET api/habits
// @desc    Get all habits of user
router.get('/', auth, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id });
    res.json(habits);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   POST api/habits
// @desc    Create a habit
router.post('/', auth, async (req, res) => {
  const { habitName, category, frequency, reminderTime } = req.body;
  try {
    const newHabit = new Habit({
      userId: req.user.id,
      habitName,
      category,
      frequency,
      reminderTime
    });
    const habit = await newHabit.save();
    res.json(habit);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   PUT api/habits/:id
// @desc    Update a habit
router.put('/:id', auth, async (req, res) => {
  const { habitName, category, frequency, reminderTime } = req.body;
  try {
    let habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ msg: 'Habit not found' });
    if (habit.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    habit = await Habit.findByIdAndUpdate(req.params.id, { $set: { habitName, category, frequency, reminderTime } }, { new: true });
    res.json(habit);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/habits/:id
// @desc    Delete a habit
router.delete('/:id', auth, async (req, res) => {
  try {
    let habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ msg: 'Habit not found' });
    if (habit.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    await Habit.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Habit removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
