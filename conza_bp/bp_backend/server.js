require('./instrument.js');

require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const morgan    = require('morgan');
const Sentry    = require('@sentry/node');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const AppError     = require('./utils/AppError');
const { authLimiter, locationLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { startLocationFlush, flushLocationBuffer }  = require('./services/workerService');

const authRoutes    = require('./routes/authRoutes');
const workerRoutes  = require('./routes/workerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const http          = require('http');
const { initSocket } = require('./services/socketService');

const app    = express();
const server = http.createServer(app);

initSocket(server);

connectDB();
require('./config/redis').getRedis().connect().catch(() => {});
startLocationFlush();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/api/workers',  authLimiter, authRoutes);
app.use('/api/workers',  apiLimiter,  workerRoutes);
app.use('/api/bookings', apiLimiter,  bookingRoutes);

app.get('/health', (req, res) =>
  res.json({ status: 'ok', env: process.env.NODE_ENV })
);

app.all('*', (req, res, next) =>
  next(new AppError(`Route ${req.originalUrl} not found.`, 404))
);

// Sentry error handler — must be before any other error middleware
Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

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