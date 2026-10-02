const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const db = require('./db/connection');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const salesRoutes = require('./routes/sales.routes');
const reportsRoutes = require('./routes/reports.routes');

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({
    message: 'Hospital Pharmacy POS & Inventory API Server',
    status: 'Running'
  });
});

// Health check endpoint (Used to verify backend and database connectivity)
app.get('/api/health', (req, res) => {
  try {
    const medCount = db.prepare('SELECT COUNT(*) as count FROM medicines').get().count;
    const batchCount = db.prepare('SELECT COUNT(*) as count FROM inventory_batches').get().count;
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    res.json({
      status: 'healthy',
      system: 'Hospital Pharmacy POS API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        type: 'SQLite',
        stats: {
          medicines: medCount,
          batches: batchCount,
          staffUsers: userCount
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      database: {
        status: 'error',
        message: err.message
      }
    });
  }
});

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

const { initDailyScheduler } = require('./services/dailySchedulerService');

// Start listening on 0.0.0.0 to support both IPv4 and IPv6 loopback
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Hospital Pharmacy Backend running on port ${PORT}`);
  console.log(`🔗 Health check available at: http://localhost:${PORT}/api/health (or http://127.0.0.1:${PORT}/api/health)`);
  // Initialize automated daily report export & reset scheduler
  initDailyScheduler();
});
