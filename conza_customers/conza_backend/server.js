require('./instrument.js');

const express = require('express');
const compression = require('compression');
const dotenv  = require('dotenv');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');
const Sentry  = require('@sentry/node');

dotenv.config();

const connectDB            = require('./config/db');
const authRoutes           = require('./routes/authRoutes');
const workerRoutes         = require('./routes/workerRoutes');
const bookingRoutes        = require('./routes/bookingRoutes');
const sellerAuthRoutes     = require('./routes/sellerAuthRoutes');
const productRoutes        = require('./routes/productRoutes');
const sellerOrderRoutes    = require('./routes/sellerOrderRoutes');
const { errorHandler }     = require('./middleware/errorMiddleware');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');

const http = require('http');
const { initSocket } = require('./services/socketService');

connectDB();
require('./config/redis').getRedis().connect().catch(() => {});

const app    = express();
const server = http.createServer(app);

initSocket(server);

app.use(helmet());
app.use(compression());

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

// ── Customer routes ──
app.use('/api/auth',     authLimiter, authRoutes);
app.use('/api/workers',  apiLimiter,  workerRoutes);
app.use('/api/bookings', apiLimiter,  bookingRoutes);

// ── Seller routes ──
app.use('/api/seller/auth',     authLimiter, sellerAuthRoutes);
app.use('/api/seller/products', productRoutes);
app.use('/api/seller/orders',   sellerOrderRoutes);

// ── Public product browsing ──
app.use('/api/products', require('./routes/productRoutes'));

// ── Customer place seller order ──
app.use('/api/orders/seller', sellerOrderRoutes);

// Health
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Sentry error handler — must be before any other error middleware
Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));