/**
 * HabitForge — ML Integration Routes
 * Proxies requests to the Python FastAPI ML service (port 8000).
 * Exposes /api/ml/predict and /api/ml/forecast endpoints.
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const Habit = require('../models/Habit');

const ML_API_BASE = process.env.ML_API_URL || 'http://localhost:8000';

// ─── Health Check ───────────────────────────────────────────────────────────────
// @route   GET /api/ml/health
// @desc    Check ML service status
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${ML_API_BASE}/health`, { timeout: 5000 });
    res.json(response.data);
  } catch (err) {
    res.json({
      status: 'ml_service_offline',
      message: 'ML API is not running. Start it with: cd ml && python api.py',
    });
  }
});

// ─── Habit Completion Prediction ────────────────────────────────────────────────
// @route   POST /api/ml/predict
// @desc    Predict if user will complete a habit today
// @access  Private (JWT required)
router.post('/predict', auth, async (req, res) => {
  try {
    const { habitId } = req.body;
    const userId = req.user.id;

    if (!habitId) {
      return res.status(400).json({ msg: 'habitId is required' });
    }

    // Verify the habit belongs to this user
    const habit = await Habit.findOne({ _id: habitId, userId });
    if (!habit) {
      return res.status(404).json({ msg: 'Habit not found' });
    }

    const response = await axios.post(`${ML_API_BASE}/predict-habit`, {
      user_id: userId,
      habit_id: habitId,
    }, { timeout: 10000 });

    res.json({
      habitName: habit.habitName,
      category: habit.category,
      ...response.data,
    });
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(503).json({
      msg: 'ML service unavailable',
      detail: 'Start the ML API: cd ml && python api.py',
    });
  }
});

// ─── Predict All Habits for a User ──────────────────────────────────────────────
// @route   GET /api/ml/predict-all
// @desc    Get predictions for all active habits of the logged-in user
// @access  Private
router.get('/predict-all', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const habits = await Habit.find({ userId });

    if (!habits.length) {
      return res.json({ predictions: [], msg: 'No habits found.' });
    }

    const predictions = await Promise.allSettled(
      habits.map(async (habit) => {
        try {
          const response = await axios.post(`${ML_API_BASE}/predict-habit`, {
            user_id: userId,
            habit_id: habit._id.toString(),
          }, { timeout: 10000 });
          return {
            habitId: habit._id,
            habitName: habit.habitName,
            category: habit.category,
            ...response.data,
          };
        } catch {
          return {
            habitId: habit._id,
            habitName: habit.habitName,
            prediction: 'unavailable',
            probability: 0.5,
            confidence: 'low',
          };
        }
      })
    );

    res.json({
      predictions: predictions.map(p => p.status === 'fulfilled' ? p.value : p.reason),
    });
  } catch (err) {
    res.status(503).json({ msg: 'ML service unavailable' });
  }
});

// ─── Consistency Forecast ───────────────────────────────────────────────────────
// @route   GET /api/ml/forecast
// @desc    Forecast consistency for logged-in user (next 7 days)
// @access  Private
router.get('/forecast', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const horizon = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 30);

    const response = await axios.get(
      `${ML_API_BASE}/forecast-consistency/${userId}?horizon=${horizon}`,
      { timeout: 15000 }
    );

    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(503).json({
      msg: 'ML service unavailable',
      detail: 'Start the ML API: cd ml && python api.py',
    });
  }
});

module.exports = router;
