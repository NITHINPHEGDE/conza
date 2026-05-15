const { Server } = require('socket.io');
const mongoose   = require('mongoose');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Start watching changes in MongoDB
  watchChanges();

  return io;
};

const watchChanges = () => {
  const db = mongoose.connection;

  db.once('open', () => {
    console.log('👀 Watching MongoDB collections for changes...');

    // 1. Watch Workers collection
    const workerChangeStream = db.collection('workers').watch([], { fullDocument: 'updateLookup' });
    workerChangeStream.on('change', (change) => {
      console.log('✨ Worker change detected:', change.operationType);
      
      // Emit update to all clients
      // In a more complex app, we could emit only to users interested in this category/location
      io.emit('worker_updated', {
        operationType: change.operationType,
        workerId:      change.documentKey._id,
        fullDocument:  change.fullDocument,
      });
    });

    // 2. Watch Bookings collection
    const bookingChangeStream = db.collection('bookings').watch([], { fullDocument: 'updateLookup' });
    bookingChangeStream.on('change', (change) => {
      console.log('✨ Booking change detected:', change.operationType);
      
      io.emit('booking_updated', {
        operationType: change.operationType,
        bookingId:     change.documentKey._id,
      });
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };
