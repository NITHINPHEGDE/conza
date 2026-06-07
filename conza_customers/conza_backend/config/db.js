const mongoose = require('mongoose');
const logger   = require('../utils/logger');
const Sentry   = require('@sentry/node');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed');
    Sentry.captureException(error);
    process.exit(1);
  }
};

module.exports = connectDB;