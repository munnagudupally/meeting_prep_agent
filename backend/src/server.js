const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Firebase Admin SDK & Firestore
const { testFirestoreConnection } = require('./config/firebase');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const prepRoutes = require('./routes/prepRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const hindsightRoutes = require('./routes/hindsightRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Enable JSON request parsing
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Meeting Prep Agent backend is running'
  });
});

// Firestore connectivity test route
app.get('/api/health/db', async (req, res) => {
  const result = await testFirestoreConnection();
  if (result.connected) {
    res.status(200).json({
      success: true,
      message: 'Firestore connection successful',
      projectId: result.projectId,
      database: result.database
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Firestore connection failed',
      details: result.error
    });
  }
});

// Mount Feature API Routes
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/prep', prepRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/hindsight', hindsightRoutes);

// 404 Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Centralized Error Handler:', err.message || err);
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`🚀 Meeting Prep Agent Backend is running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔥 Firestore Check: http://localhost:${PORT}/api/health/db`);
  console.log(`==========================================`);
});

module.exports = app;
