// conzacsb/services/socketService.js
const { Server } = require('socket.io');
const mongoose   = require('mongoose');

let io;

const initSocket = (server) => {
  io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // Customer rooms
    socket.on('join_booking',  (id) => socket.join(`booking_${id}`));
    socket.on('join_customer', (id) => socket.join(`customer_${id}`));

    // Seller room
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

      // Watch seller orders
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

      // Watch products
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