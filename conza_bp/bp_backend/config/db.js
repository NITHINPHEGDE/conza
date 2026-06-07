const mongoose = require('mongoose');
const logger   = require('../utils/logger');
const Sentry   = require('@sentry/node');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error({ err }, 'MongoDB connection failed');
    Sentry.captureException(err);
    process.exit(1);
  }
};

module.exports = connectDB;