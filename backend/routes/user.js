const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUserStats } = require('../controllers/userController');
const auth = require('../middleware/auth');

// @route   GET /api/user/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, getProfile);

// @route   PUT /api/user/profile/update
// @desc    Update user profile
// @access  Private
router.put('/profile/update', auth, updateProfile);

// @route   GET /api/user/stats
// @desc    Get user habit statistics
// @access  Private
router.get('/stats', auth, getUserStats);

module.exports = router;
