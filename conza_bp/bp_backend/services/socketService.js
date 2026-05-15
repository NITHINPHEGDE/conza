const { Server } = require('socket.io');
const mongoose   = require('mongoose');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
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

  watchChanges();

  return io;
};

const watchChanges = () => {
  const db = mongoose.connection;

  const startWatching = () => {
    console.log('👀 [BP] Watching MongoDB collections for changes...');

    try {
      const bookingChangeStream = db.collection('bookings').watch([], { fullDocument: 'updateLookup' });

      bookingChangeStream.on('change', (change) => {
        console.log('✨ [BP] Booking change detected:', change.operationType, 'status:', change.fullDocument?.status);

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
        console.error('❌ [BP] Booking change stream error:', err.message);
        // Retry after 5 seconds
        setTimeout(startWatching, 5000);
      });

    } catch (err) {
      console.error('❌ [BP] Failed to start change stream:', err.message);
      console.error('   → Make sure MongoDB is running as a replica set for Change Streams to work.');
      console.error('   → Run: mongod --replSet rs0   OR use MongoDB Atlas');
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