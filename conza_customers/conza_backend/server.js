const express = require('express');
const dotenv  = require('dotenv');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

dotenv.config();

const connectDB        = require('./config/db');
const authRoutes       = require('./routes/authRoutes');
const workerRoutes     = require('./routes/workerRoutes');
const bookingRoutes    = require('./routes/bookingRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const http = require('http');
const { initSocket } = require('./services/socketService');

connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

app.use(helmet());
app.use(cors({ origin: '*' }));  // Restrict in production
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth',    authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));