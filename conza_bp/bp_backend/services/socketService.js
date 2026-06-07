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

    // Worker joins their personal room to receive targeted events
    socket.on('join_worker', (workerId) => {
      socket.join(`worker_${workerId}`);
      socket.join('workers_room'); // room all online BP workers share
      logger.info({ workerId }, '[BP] Worker joined room');
    });

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
        const bookingId = change.documentKey._id.toString();
        const status    = change.fullDocument?.status;
        const workers   = change.fullDocument?.workers || [];

        logger.info({ operationType: change.operationType, status }, '[BP] Booking change detected');

        if (change.operationType === 'insert') {
          // New booking — notify all online workers so they can poll for new requests
          io.to('workers_room').emit('booking_updated', {
            operationType: 'insert',
            bookingId,
            status,
          });
        } else {
          // Update — notify only workers assigned to this booking
          workers.forEach((wId) => {
            io.to(`worker_${wId}`).emit('booking_updated', {
              operationType: change.operationType,
              bookingId,
              status,
            });
          });
        }

        // Always notify the specific booking room (customer tracking)
        io.to(`booking_${bookingId}`).emit('booking_status_changed', {
          bookingId,
          status,
          booking: change.fullDocument,
        });
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

  if (db.readyState === 1) startWatching();
  else db.once('open', startWatching);
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};

module.exports = { initSocket, getIO };