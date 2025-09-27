const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});
app.use(limiter);

// Import routes
const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/workers');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ASMS Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);

// Basic API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'ASMS API is working!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server only after database is ready
const startServer = async () => {
  console.log('🔄 Waiting for database connection...');
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('🚨 Could not connect to database. Exiting...');
    process.exit(1);
  }

  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ASMS Backend running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
    console.log(`👥 Worker endpoints: http://localhost:${PORT}/api/workers/*`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

// Start the server
startServer().catch(console.error);