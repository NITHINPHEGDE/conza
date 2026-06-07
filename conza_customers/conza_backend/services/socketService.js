// conza_backend/services/socketService.js
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
    logger.info('Socket.io Redis adapter attached');
  } catch (err) {
    logger.warn({ err }, 'Socket.io Redis adapter failed (running in-memory)');
  }

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected');

    socket.on('join_booking',      (id) => socket.join(`booking_${id}`));
    socket.on('join_customer',     (id) => socket.join(`customer_${id}`));
    socket.on('join_seller',       (id) => {
      socket.join(`seller_${id}`);
      logger.info({ sellerId: id }, 'Seller joined room');
    });
    socket.on('join_workers_watch', ()  => socket.join('workers_watch_room'));
    socket.on('join_products',      ()  => socket.join('products_room'));

    socket.on('disconnect', () => logger.info({ socketId: socket.id }, 'Client disconnected'));
  });

  watchChanges();
  return io;
};

const watchChanges = () => {
  const db = mongoose.connection;

  const startWatching = () => {
    logger.info('Watching MongoDB collections...');
    try {
      const workerStream = db.collection('workers').watch([], { fullDocument: 'updateLookup' });
      workerStream.on('change', (c) => {
        // Only customers actively browsing workers need this — they join workers_watch_room
        io.to('workers_watch_room').emit('worker_updated', {
          operationType: c.operationType,
          workerId:      c.documentKey._id.toString(),
          fullDocument:  c.fullDocument,
        });
      });
      workerStream.on('error', () => setTimeout(startWatching, 5000));

      const bookingStream = db.collection('bookings').watch([], { fullDocument: 'updateLookup' });
      bookingStream.on('change', (c) => {
        const bookingId = c.documentKey._id.toString();
        const status    = c.fullDocument?.status;
        const userId    = c.fullDocument?.user?.toString();

        // Notify the specific customer who owns this booking
        if (userId) {
          io.to(`customer_${userId}`).emit('booking_updated', {
            operationType: c.operationType,
            bookingId,
            status,
          });
        }

        // Notify booking-specific room (worker tracking screen)
        if (c.documentKey._id) {
          io.to(`booking_${bookingId}`).emit('booking_status_changed', {
            bookingId,
            status,
          });
        }
      });
      bookingStream.on('error', () => setTimeout(startWatching, 5000));

      const sellerOrderStream = db.collection('sellerorders').watch([], { fullDocument: 'updateLookup' });
      sellerOrderStream.on('change', (c) => {
        const doc = c.fullDocument;
        if (!doc) return;
        io.to(`seller_${doc.seller}`).emit('seller_order_change', {
          operationType: c.operationType,
          orderId:       c.documentKey._id.toString(),
          status:        doc.status,
        });
        io.to(`customer_${doc.customer}`).emit('seller_order_status_changed', {
          orderId: c.documentKey._id.toString(),
          status:  doc.status,
        });
      });
      sellerOrderStream.on('error', () => setTimeout(startWatching, 5000));

      const productStream = db.collection('products').watch([], { fullDocument: 'updateLookup' });
      productStream.on('change', (c) => {
        // Only customers on the product listing screen need this
        io.to('products_room').emit('product_updated', {
          operationType: c.operationType,
          productId:     c.documentKey._id.toString(),
        });
      });
      productStream.on('error', () => setTimeout(startWatching, 5000));

    } catch (err) {
      logger.error({ err }, 'Change streams failed — run MongoDB as replica set or use Atlas');
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