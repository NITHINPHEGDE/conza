// conzasb/services/socketService.js
const { Server } = require('socket.io');
const mongoose   = require('mongoose');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],  // allow polling fallback
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.id}`);

    // Seller joins their private room to receive order notifications
    socket.on('join_seller', (sellerId) => {
      socket.join(`seller_${sellerId}`);
      console.log(`🏪 Seller joined room: seller_${sellerId}`);
    });

    // Customer joins to receive status updates
    socket.on('join_customer', (customerId) => {
      socket.join(`customer_${customerId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${socket.id}`);
    });
  });

  watchChanges();
  return io;
};

const watchChanges = () => {
  const db = mongoose.connection;

  const startWatching = () => {
    console.log('👀 Watching seller collections for changes...');

    try {
      // Watch orders
      const orderStream = db.collection('sellerorders').watch(
        [], { fullDocument: 'updateLookup' }
      );
      orderStream.on('change', (c) => {
        const doc = c.fullDocument;
        if (!doc) return;
        // Notify seller room
        io.to(`seller_${doc.seller}`).emit('order_change', {
          operationType: c.operationType,
          orderId:       c.documentKey._id.toString(),
          status:        doc.status,
        });
        // Notify customer room
        if (doc.customerId) {
          io.to(`customer_${doc.customerId}`).emit('seller_order_status_changed', {
            orderId: c.documentKey._id.toString(),
            status:  doc.status,
          });
        }
      });
      orderStream.on('error', () => setTimeout(startWatching, 5000));

      // Watch products (so seller dashboard reflects live inventory)
      const productStream = db.collection('products').watch(
        [], { fullDocument: 'updateLookup' }
      );
      productStream.on('change', (c) => {
        const doc = c.fullDocument;
        if (!doc) return;
        io.to(`seller_${doc.seller}`).emit('product_change', {
          operationType: c.operationType,
          productId:     c.documentKey._id.toString(),
        });
      });
      productStream.on('error', () => setTimeout(startWatching, 5000));

    } catch (err) {
      console.error('❌ Change streams failed:', err.message);
      console.error('   → MongoDB must run as a replica set or use Atlas');
    }
  };

  if (db.readyState === 1) startWatching();
  else db.once('open', startWatching);
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };