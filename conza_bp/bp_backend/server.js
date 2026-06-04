
require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const morgan       = require('morgan');
const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const AppError     = require('./utils/AppError');
const { authLimiter, locationLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { startLocationFlush, flushLocationBuffer }  = require('./services/workerService');

// ── Routes ─────────────────────────────────────────────────────────────────
const authRoutes    = require('./routes/authRoutes');
const workerRoutes  = require('./routes/workerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const http          = require('http');
const { initSocket } = require('./services/socketService');

const app    = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// ── Connect DB ─────────────────────────────────────────────────────────────
connectDB();
// Warm up Redis + start GPS location buffer flush
require('./config/redis').getRedis().connect().catch(() => {});
startLocationFlush();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));  // tighten in production
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/workers',  authLimiter,    authRoutes);
app.use('/api/workers',  apiLimiter,    workerRoutes);
app.use('/api/bookings', apiLimiter,    bookingRoutes);

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
// Graceful shutdown: flush buffered GPS coordinates before process exits
const gracefulShutdown = async (signal) => {
  console.log(`\n[BP] ${signal} received — flushing GPS buffer before exit...`);
  await flushLocationBuffer().catch(() => {});
  process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Conza BP backend running on port ${PORT} [${process.env.NODE_ENV}]`)
);

module.exports = app;
