import { config } from './config.js'; // MUST be at the very top
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { initDb } from './db.js';

import authRoutes from './routes/auth.js';
import vehiclesRoutes from './routes/vehicles.js';
import driversRoutes from './routes/drivers.js';
import tripsRoutes from './routes/trips.js';
import maintenanceRoutes from './routes/maintenance.js';
import dashboardRoutes from './routes/dashboard.js';
import financeRoutes from './routes/finance.js';

const app = express();

// Init Database
initDb();

// Middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173', // vite preview
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];
app.use(cors({
  origin: (origin, callback) => {
    // Security Fix: Reject requests with no origin unless in development
    if (!origin) {
      if (config.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('CORS: Requests with no origin are strictly forbidden in production'));
    }
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000 
});
app.use('/api', limiter);

// Root info endpoint
app.get('/', (req, res) => {
  res.json({ name: 'TransitOps API', status: 'running', version: '1.0.0' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/finance', financeRoutes);

// 404 catch-all for /api routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.path}` });
});

// Security Fix: Enhanced Global Error Handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  
  if (status === 500) {
    // Log the detailed error internally for debugging
    console.error('🔥 [500 Internal Error]:', err.stack);
    // Return generic message to client to prevent leaking sensitive info, DB schemas, or SQL syntax
    return res.status(500).json({ error: 'An unexpected server error occurred.' });
  }

  res.status(status).json({ error: err.message || 'Error occurred' });
});
const PORT = config.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  const server = app.listen(PORT, () => {
    console.log(`✅ TransitOps API running on http://localhost:${PORT} in ${config.NODE_ENV} mode`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Kill the existing process first: kill $(lsof -ti:${PORT})`);
      process.exit(1);
    }
    throw err;
  });
}

export default app;
