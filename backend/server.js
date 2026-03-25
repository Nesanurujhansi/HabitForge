const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1 && !allowedOrigins.includes('*')) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const habitLogRoutes = require('./routes/habitLogs');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const analyticsRoutes = require('./routes/analytics');
const achievementsRoutes = require('./routes/achievements');
const mlRoutes = require('./routes/ml');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/habitlogs', habitLogRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/ml', mlRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Something went wrong!', error: err.message });
});

// Database Connection

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is missing from .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas Cluster');
    app.listen(PORT, () => {
      console.log(`HabitForge Server is live on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('CRITICAL: Database connection failed:', err.message);
    process.exit(1);
  });
