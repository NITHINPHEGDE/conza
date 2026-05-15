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
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join_booking', (bookingId) => {
      socket.join(`booking_${bookingId}`);
      console.log(`🔌 Client joined booking room: booking_${bookingId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  watchChanges();

  return io;
};

const watchChanges = () => {
  const db = mongoose.connection;

  const startWatching = () => {
    console.log('👀 Watching MongoDB collections for changes...');

    try {
      // Watch Workers collection
      const workerChangeStream = db.collection('workers').watch([], { fullDocument: 'updateLookup' });
      workerChangeStream.on('change', (change) => {
        console.log('✨ Worker change detected:', change.operationType);
        io.emit('worker_updated', {
          operationType: change.operationType,
          workerId:      change.documentKey._id.toString(),
          fullDocument:  change.fullDocument,
        });
      });
      workerChangeStream.on('error', (err) => {
        console.error('❌ Worker change stream error:', err.message);
        setTimeout(startWatching, 5000);
      });

      // Watch Bookings collection
      const bookingChangeStream = db.collection('bookings').watch([], { fullDocument: 'updateLookup' });
      bookingChangeStream.on('change', (change) => {
        console.log('✨ Booking change detected:', change.operationType, 'status:', change.fullDocument?.status);

        io.emit('booking_updated', {
          operationType: change.operationType,
          bookingId:     change.documentKey._id.toString(),
          status:        change.fullDocument?.status,
        });

        if (change.documentKey._id) {
          io.to(`booking_${change.documentKey._id}`).emit('booking_status_changed', {
            bookingId: change.documentKey._id.toString(),
            status:    change.fullDocument?.status,
          });
        }
      });
      bookingChangeStream.on('error', (err) => {
        console.error('❌ Booking change stream error:', err.message);
        setTimeout(startWatching, 5000);
      });

    } catch (err) {
      console.error('❌ Failed to start change streams:', err.message);
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