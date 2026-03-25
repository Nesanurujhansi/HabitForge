const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const auth = require('../middleware/auth');

// @route   GET api/achievements
// @desc    Get user achievements
router.get('/', auth, async (req, res) => {
  try {
    const achievements = await Achievement.find({ userId: req.user.id });
    res.json(achievements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
