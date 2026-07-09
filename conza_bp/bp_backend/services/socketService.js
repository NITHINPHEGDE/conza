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

// ── Build the worker payload the customer frontend needs ───────────────────
// This mirrors the shape produced by getNearbyWorkers so the frontend can
// add/update the worker in its list without making an additional HTTP call.
const buildWorkerPayload = (doc) => {
  if (!doc) return null;
  return {
    id:           doc._id.toString(),
    _id:          doc._id.toString(),
    name:         doc.fullName,
    initials:     doc.fullName
      ? doc.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
      : '??',
    category:     doc.category,
    skills:       doc.skills || [],
    pricePerDay:  doc.minCharge || 0,
    minCharge:    doc.minCharge || 0,
    rating:       doc.rating || 5.0,
    totalJobs:    doc.totalJobs || 0,
    // Distance is unknown server-side without the customer's location;
    // the frontend will show a placeholder and update on next refresh.
    distance:     doc.locationText || '—',
    distanceKm:   null,
    available:    doc.isOnline === true,
    isOnline:     doc.isOnline === true,
    bio:          doc.bio || '',
    experience:   doc.experience || null,
    locationText: doc.locationText || '',
    memberSince:  doc.memberSince || '',
    profileImage: doc.profileImage || null,
  };
};

// Routine GPS buffer flush only ever touches these fields together, every
// 10-15s, for every online worker (see workerService.js flushLocationBuffer).
// Broadcasting a "worker_updated"/"worker_availability_changed" event for
// every single ping fans out to every connected customer and was causing
// the whole customer app to visibly "refresh" every few seconds. We still
// want the location itself to reach anyone actively tracking a specific
// worker (handled separately, per-booking), so it's safe to skip these on
// the global watch room.
const PING_ONLY_FIELDS = new Set(['location', 'lastLocationAt', 'isOnline']);

const isRoutineLocationPing = (c) => {
  if (c.operationType !== 'update') return false;
  const updatedFields = c.updateDescription?.updatedFields || {};
  const keys = Object.keys(updatedFields);
  if (!keys.length) return false;
  if (!keys.every((k) => PING_ONLY_FIELDS.has(k))) return false;
  // An explicit "went offline" flip must still be broadcast so customers
  // see it immediately — only suppress when the worker stayed/came online.
  return c.fullDocument?.isOnline !== false;
};

const watchChanges = () => {
  const db = mongoose.connection;

  const startWatching = () => {
    logger.info('Watching MongoDB collections...');
    try {
      const workerStream = db.collection('workers').watch([], { fullDocument: 'updateLookup' });

      workerStream.on('change', (c) => {
        const workerId     = c.documentKey._id.toString();
        const doc          = c.fullDocument;
        const routinePing  = isRoutineLocationPing(c);

        // ── Generic worker_updated (backwards-compat) ──────────────────────
        // All customers actively browsing workers receive this — but skip
        // routine location-only pings, they carry no meaningful change.
        if (!routinePing) {
          io.to('workers_watch_room').emit('worker_updated', {
            operationType: c.operationType,
            workerId,
            fullDocument:  doc,
          });
        }

        // ── Precise availability event ─────────────────────────────────────
        // Emitted on every real insert/update so the customer frontend can
        // add/remove workers from the "Available Now" list in real-time
        // without needing to re-fetch (and hit stale cache).
        if ((c.operationType === 'insert' || c.operationType === 'update') && !routinePing) {
          io.to('workers_watch_room').emit('worker_availability_changed', {
            workerId,
            isOnline:  doc ? doc.isOnline  : false,
            isAvailable: doc ? doc.isAvailable : true,
            category:  doc ? doc.category  : null,
            worker:    doc ? buildWorkerPayload(doc) : null,
          });
        }

        // ── Explicit offline broadcast ─────────────────────────────────────
        // When a worker is explicitly set offline, emit a focused event so
        // the frontend can immediately remove them without checking fields.
        if (
          c.operationType === 'update' &&
          doc &&
          doc.isOnline === false
        ) {
          io.to('workers_watch_room').emit('worker_went_offline', {
            workerId,
            category: doc.category,
          });
        }
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

        // Notify booking-specific room (worker tracking screen + labour app)
        if (c.documentKey._id) {
          io.to(`booking_${bookingId}`).emit('booking_status_changed', {
            bookingId,
            status,
          });

          // When the customer confirms completion (status → 'completed'),
          // also emit job_completed_confirmed so the labour app's existing
          // handler triggers the CompletionModal as a belt-and-suspenders fallback.
          if (status === 'completed') {
            io.to(`booking_${bookingId}`).emit('job_completed_confirmed', {
              bookingId,
            });
          }
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