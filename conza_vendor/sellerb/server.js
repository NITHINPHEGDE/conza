// conzasb/server.js
const express    = require('express');
const dotenv     = require('dotenv');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const http       = require('http');

dotenv.config();

const connectDB          = require('./config/db');
const authRoutes         = require('./routes/authRoutes');
const productRoutes      = require('./routes/productRoutes');
const orderRoutes        = require('./routes/orderRoutes');
const { getDashboard }   = require('./controllers/dashboardController');
const { protect }        = require('./middleware/authMiddleware');
const { errorHandler }   = require('./middleware/errorMiddleware');
const { initSocket }     = require('./services/socketService');

connectDB();

const app    = express();
const server = http.createServer(app);

initSocket(server);

app.use(helmet());
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

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);

// Dashboard (seller only)
app.get('/api/dashboard', protect, getDashboard);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Seller backend running on port ${PORT}`));