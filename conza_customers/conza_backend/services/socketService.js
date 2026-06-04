// conza_backend/services/socketService.js
const { Server }            = require('socket.io');
const { createAdapter }     = require('@socket.io/redis-adapter');
const mongoose              = require('mongoose');
const { getRedis, getSubscriber } = require('../config/redis');

let io;

const initSocket = (server) => {
  io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

  // ── Redis Pub/Sub adapter for horizontal scaling ──────────────────────────
  try {
    const pubClient = getRedis();
    const subClient = getSubscriber();
    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Socket.io Redis adapter attached');
  } catch (err) {
    console.warn('⚠️  Socket.io Redis adapter failed (running in-memory):', err.message);
    // Falls back to in-memory adapter — single-instance still works fine
  }

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    socket.on('join_booking',  (id) => socket.join(`booking_${id}`));
    socket.on('join_customer', (id) => socket.join(`customer_${id}`));
    socket.on('join_seller',   (id) => {
      socket.join(`seller_${id}`);
      console.log(`🏪 Seller joined room: seller_${id}`);
    });

    socket.on('disconnect', () => console.log(`🔌 Disconnected: ${socket.id}`));
  });

  watchChanges();
  return io;
};

const watchChanges = () => {
  const db = mongoose.connection;

  const startWatching = () => {
    console.log('👀 Watching MongoDB collections...');
    try {
      const workerStream = db.collection('workers').watch([], { fullDocument: 'updateLookup' });
      workerStream.on('change', (c) => {
        io.emit('worker_updated', { operationType: c.operationType, workerId: c.documentKey._id.toString(), fullDocument: c.fullDocument });
      });
      workerStream.on('error', () => setTimeout(startWatching, 5000));

      const bookingStream = db.collection('bookings').watch([], { fullDocument: 'updateLookup' });
      bookingStream.on('change', (c) => {
        io.emit('booking_updated', { operationType: c.operationType, bookingId: c.documentKey._id.toString(), status: c.fullDocument?.status });
        if (c.documentKey._id) {
          io.to(`booking_${c.documentKey._id}`).emit('booking_status_changed', { bookingId: c.documentKey._id.toString(), status: c.fullDocument?.status });
        }
      });
      bookingStream.on('error', () => setTimeout(startWatching, 5000));

      const sellerOrderStream = db.collection('sellerorders').watch([], { fullDocument: 'updateLookup' });
      sellerOrderStream.on('change', (c) => {
        const doc = c.fullDocument;
        if (!doc) return;
        io.to(`seller_${doc.seller}`).emit('seller_order_change', { operationType: c.operationType, orderId: c.documentKey._id.toString(), status: doc.status });
        io.to(`customer_${doc.customer}`).emit('seller_order_status_changed', { orderId: c.documentKey._id.toString(), status: doc.status });
      });
      sellerOrderStream.on('error', () => setTimeout(startWatching, 5000));

      const productStream = db.collection('products').watch([], { fullDocument: 'updateLookup' });
      productStream.on('change', (c) => {
        io.emit('product_updated', { operationType: c.operationType, productId: c.documentKey._id.toString() });
      });
      productStream.on('error', () => setTimeout(startWatching, 5000));

    } catch (err) {
      console.error('❌ Change streams failed:', err.message);
      console.error('   → Run MongoDB as replica set or use Atlas for Change Streams');
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