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
    console.log(`🔌 [BP] Client connected: ${socket.id}`);

    socket.on('join_booking', (bookingId) => {
      socket.join(`booking_${bookingId}`);
      console.log(`🔌 [BP] Client joined booking room: booking_${bookingId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [BP] Client disconnected: ${socket.id}`);
    });
  });

  // Start watching changes in MongoDB
  watchChanges();

  return io;
};

const watchChanges = () => {
  const db = mongoose.connection;

  const startWatching = () => {
    console.log('👀 [BP] Watching MongoDB collections for changes...');

    // Watch Bookings collection
    const bookingChangeStream = db.collection('bookings').watch([], { fullDocument: 'updateLookup' });
    bookingChangeStream.on('change', (change) => {
      console.log('✨ [BP] Booking change detected:', change.operationType);
      
      // Emit to all for lists
      io.emit('booking_updated', {
        operationType: change.operationType,
        bookingId:     change.documentKey._id,
        status:        change.fullDocument?.status
      });

      // Also emit to specific room if relevant
      if (change.documentKey._id) {
        io.to(`booking_${change.documentKey._id}`).emit('booking_status_changed', {
          bookingId: change.documentKey._id,
          status:    change.fullDocument?.status,
          booking:   change.fullDocument
        });
      }
    });
  };

  if (db.readyState === 1) {
    startWatching();
  } else {
    db.once('open', startWatching);
  }
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };
