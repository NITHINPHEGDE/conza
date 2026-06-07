// bp_backend/services/socketService.js
const { Server }                  = require('socket.io');
const { createAdapter }           = require('@socket.io/redis-adapter');
const mongoose                    = require('mongoose');
const { getRedis, getSubscriber } = require('../config/redis');
const logger                      = require('../utils/logger');
const Sentry                      = require('@sentry/node');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  try {
    const pubClient = getRedis();
    const subClient = getSubscriber();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('[BP] Socket.io Redis adapter attached');
  } catch (err) {
    logger.warn({ err }, '[BP] Socket.io Redis adapter failed (running in-memory)');
  }

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, '[BP] Client connected');

    socket.on('join_booking', (bookingId) => {
      socket.join(`booking_${bookingId}`);
      logger.info({ bookingId }, '[BP] Client joined booking room');
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, '[BP] Client disconnected');
    });
  });

  watchChanges();
  return io;
};

const watchChanges = () => {
  const db = mongoose.connection;

  const startWatching = () => {
    logger.info('[BP] Watching MongoDB collections for changes...');

    try {
      const bookingChangeStream = db.collection('bookings').watch([], { fullDocument: 'updateLookup' });

      bookingChangeStream.on('change', (change) => {
        logger.info({ operationType: change.operationType, status: change.fullDocument?.status }, '[BP] Booking change detected');

        io.emit('booking_updated', {
          operationType: change.operationType,
          bookingId:     change.documentKey._id.toString(),
          status:        change.fullDocument?.status,
        });

        if (change.documentKey._id) {
          io.to(`booking_${change.documentKey._id}`).emit('booking_status_changed', {
            bookingId: change.documentKey._id.toString(),
            status:    change.fullDocument?.status,
            booking:   change.fullDocument,
          });
        }
      });

      bookingChangeStream.on('error', (err) => {
        logger.error({ err }, '[BP] Booking change stream error');
        Sentry.captureException(err);
        setTimeout(startWatching, 5000);
      });

    } catch (err) {
      logger.error({ err }, '[BP] Failed to start change stream — run MongoDB as replica set or use Atlas');
      Sentry.captureException(err);
    }
  };

  if (db.readyState === 1) {
    startWatching();
  } else {
    db.once('open', startWatching);
  }
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};

module.exports = { initSocket, getIO };