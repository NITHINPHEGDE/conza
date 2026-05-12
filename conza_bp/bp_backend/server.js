require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const morgan       = require('morgan');
const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const AppError     = require('./utils/AppError');

// ── Routes ─────────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/authRoutes');
const workerRoutes  = require('./routes/workerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// ── Connect DB ─────────────────────────────────────────────────────────────
connectDB();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));  // tighten in production
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/workers',  authRoutes);
app.use('/api/workers',  workerRoutes);
app.use('/api/bookings', bookingRoutes);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', env: process.env.NODE_ENV })
);

// ── 404 Handler ────────────────────────────────────────────────────────────
app.all('*', (req, res, next) =>
  next(new AppError(`Route ${req.originalUrl} not found.`, 404))
);

// ── Centralized Error Handler ──────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Conza backend running on port ${PORT} [${process.env.NODE_ENV}]`)
);

module.exports = app;
