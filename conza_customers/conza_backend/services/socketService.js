// conza_backend/services/socketService.js
const { Server }                  = require('socket.io');
const { createAdapter }           = require('@socket.io/redis-adapter');
const mongoose                    = require('mongoose');
const { getRedis, getSubscriber } = require('../config/redis');
const logger                      = require('../utils/logger');
const Sentry                      = require('@sentry/node');
const jwt                         = require('jsonwebtoken');
const User                        = require('../models/User');
const Seller                      = require('../models/Seller');
const Worker                      = require('../models/Worker');
const Booking                     = require('../models/Booking');

let io;

// Sanitize worker document before broadcasting to public workers_watch_room.
// Prevents exposing sensitive fields (password hash, phone, email, pushToken, etc.).
const sanitizeWorkerForWatch = (doc) => {
  if (!doc) return null;
  return {
    _id:          doc._id?.toString(),
    fullName:     doc.fullName,
    categories:   doc.categories || [],
    skills:       doc.skills || [],
    rating:       doc.rating,
    totalJobs:    doc.totalJobs,
    isOnline:     doc.isOnline,
    isAvailable:  doc.isAvailable,
    isVerified:   doc.isVerified,
    status:       doc.status,
    bio:          doc.bio,
    experience:   doc.experience,
    locationText: doc.locationText,
    memberSince:  doc.memberSince,
    profileImage: doc.profileImage,
    location:     doc.location,
  };
};

// ── Multi-Party Booking Authorization ───────────────────────────────────────
// A booking legitimately involves multiple parties (the customer who created
// it, and any assigned workers). Verify that the authenticated socket is a
// legitimate participant before allowing them to join booking_<bookingId>.
const joinBookingRoomIfAuthorized = async (socket, bookingId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return socket.emit('socket_error', { message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(bookingId)
      .select('user workers workerStatuses')
      .lean();

    if (!booking) {
      return socket.emit('socket_error', { message: 'Booking not found' });
    }

    const customerIdStr = socket.data.customerId || (socket.data.role === 'customer' ? socket.data.userId : null);
    const workerIdStr   = socket.data.workerId   || (socket.data.role === 'worker'   ? socket.data.userId : null);
    const genericUserId = socket.data.userId;

    const isCustomerOwner =
      Boolean(customerIdStr && booking.user?.toString() === customerIdStr) ||
      Boolean(genericUserId && booking.user?.toString() === genericUserId);

    const isAssignedWorker =
      Boolean(workerIdStr && (
        (booking.workers || []).some((w) => (w?._id || w)?.toString() === workerIdStr) ||
        (booking.workerStatuses || []).some((ws) => (ws?.worker?._id || ws?.worker)?.toString() === workerIdStr)
      )) ||
      Boolean(genericUserId && (
        (booking.workers || []).some((w) => (w?._id || w)?.toString() === genericUserId) ||
        (booking.workerStatuses || []).some((ws) => (ws?.worker?._id || ws?.worker)?.toString() === genericUserId)
      ));

    if (isCustomerOwner || isAssignedWorker) {
      socket.join(`booking_${bookingId}`);
    } else {
      socket.emit('socket_error', { message: 'Not authorized for this booking' });
    }
  } catch (err) {
    logger.warn({ err: err.message, bookingId }, 'join_booking authorization check failed');
  }
};

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

  // ── Handshake Authentication ──────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
        // Unauthenticated connection (guest) — permitted for public rooms (e.g. workers_watch_room, products_room)
        socket.data.authenticated = false;
        socket.data.userId = null;
        socket.data.role = 'guest';
        socket.userId = null;
        socket.role = 'guest';
        return next();
      }

      const token = rawToken.trim();
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'conza_jwt_secret_fallback_2026');
      } catch (err) {
        // Try fallback for BP worker secret if cross-connecting
        try {
          decoded = jwt.verify(token, process.env.BP_JWT_SECRET || 'conza_super_secret_jwt_key_2026');
        } catch (_) {
          logger.warn({ err: err.message }, 'Socket authentication failed: invalid or expired token');
          return next(new Error('Authentication failed'));
        }
      }

      if (!decoded || !decoded.id) {
        return next(new Error('Authentication failed'));
      }

      // Check Redis blacklist for revoked tokens
      try {
        const redis = getRedis();
        const revoked = await redis.get(`blacklist:${token}`);
        if (revoked) {
          logger.warn({ userId: decoded.id }, 'Socket authentication failed: token revoked');
          return next(new Error('Authentication failed'));
        }
      } catch (_) {}

      // Handle Seller role
      if (decoded.role === 'seller') {
        const seller = await Seller.findById(decoded.id).select('-password').lean();
        if (!seller || seller.status === 'suspended') {
          logger.warn({ sellerId: decoded.id }, 'Socket auth rejected: seller not found or suspended');
          return next(new Error('Authentication failed'));
        }
        const sId = seller._id.toString();
        socket.data.authenticated = true;
        socket.data.userId        = sId;
        socket.data.sellerId      = sId;
        socket.data.role          = 'seller';
        socket.data.tokenExp      = decoded.exp;
        socket.data.authToken     = token;
        socket.userId             = sId;
        socket.sellerId           = sId;
        socket.role               = 'seller';
        return next();
      }

      // Handle Customer role
      let user = null;
      const cacheKey = `user:session:${decoded.id}`;
      try {
        const redis = getRedis();
        const cached = await redis.get(cacheKey);
        if (cached) user = JSON.parse(cached);
      } catch (_) {}

      if (!user) {
        user = await User.findById(decoded.id).select('-password').lean();
        if (user) {
          try {
            const redis = getRedis();
            await redis.set(cacheKey, JSON.stringify(user), 'EX', 60);
          } catch (_) {}
        }
      }

      if (user) {
        if (user.status === 'suspended') {
          logger.warn({ userId: decoded.id }, 'Socket auth rejected: user suspended');
          return next(new Error('Authentication failed'));
        }
        const uId = user._id.toString();
        socket.data.authenticated = true;
        socket.data.userId        = uId;
        socket.data.customerId    = uId;
        socket.data.role          = 'customer';
        socket.data.tokenExp      = decoded.exp;
        socket.data.authToken     = token;
        socket.userId             = uId;
        socket.customerId         = uId;
        socket.role               = 'customer';
        return next();
      }

      // Check if Worker identity
      const worker = await Worker.findById(decoded.id).select('-password').lean();
      if (worker) {
        if (worker.status === 'suspended') {
          logger.warn({ workerId: decoded.id }, 'Socket auth rejected: worker suspended');
          return next(new Error('Authentication failed'));
        }
        const wId = worker._id.toString();
        socket.data.authenticated = true;
        socket.data.userId        = wId;
        socket.data.workerId      = wId;
        socket.data.role          = 'worker';
        socket.data.tokenExp      = decoded.exp;
        socket.data.authToken     = token;
        socket.userId             = wId;
        socket.workerId           = wId;
        socket.role               = 'worker';
        return next();
      }

      return next(new Error('Authentication failed'));
    } catch (err) {
      logger.error({ err }, 'Socket handshake authentication error');
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id, userId: socket.userId, role: socket.role }, 'Client connected');

    // Automatically join the authenticated customer's, seller's, or worker's personal room
    if (socket.data.authenticated) {
      if (socket.data.role === 'customer' && socket.data.customerId) {
        socket.join(`customer_${socket.data.customerId}`);
        logger.info({ customerId: socket.data.customerId }, 'Customer joined private room');
      } else if (socket.data.role === 'seller' && socket.data.sellerId) {
        socket.join(`seller_${socket.data.sellerId}`);
        logger.info({ sellerId: socket.data.sellerId }, 'Seller joined private room');
      } else if (socket.data.role === 'worker' && socket.data.workerId) {
        socket.join(`worker_${socket.data.workerId}`);
        logger.info({ workerId: socket.data.workerId }, 'Worker joined private room');
      }

      // ── Enforce Token Expiry on Connected Socket ──────────────────────────
      if (socket.data.tokenExp) {
        const remainingMs = (socket.data.tokenExp * 1000) - Date.now();
        if (remainingMs > 0 && remainingMs < 0x7FFFFFFF) {
          const expiryTimer = setTimeout(() => {
            logger.info({ socketId: socket.id, userId: socket.userId }, 'Socket authentication expired (JWT exp)');
            socket.emit('socket_error', { message: 'Session expired. Please reconnect.' });
            socket.disconnect(true);
          }, remainingMs);
          socket.on('disconnect', () => clearTimeout(expiryTimer));
        } else if (remainingMs <= 0) {
          socket.emit('socket_error', { message: 'Token expired' });
          socket.disconnect(true);
          return;
        }
      }

      // ── Periodic Revocation & Suspension Check (every 5 min) ──────────────
      const revocationCheck = setInterval(async () => {
        if (!socket.connected || !socket.data.authenticated) return;
        try {
          const redis = getRedis();
          if (socket.data.authToken) {
            const revoked = await redis.get(`blacklist:${socket.data.authToken}`);
            if (revoked) {
              logger.warn({ socketId: socket.id, userId: socket.userId }, 'Active socket token was revoked');
              socket.emit('socket_error', { message: 'Token has been revoked' });
              socket.disconnect(true);
              return;
            }
          }
          if (socket.data.role === 'customer' && socket.data.customerId) {
            const u = await User.findById(socket.data.customerId).select('status').lean();
            if (!u || u.status === 'suspended') {
              logger.warn({ customerId: socket.data.customerId }, 'Active socket user was suspended');
              socket.emit('socket_error', { message: 'Account suspended' });
              socket.disconnect(true);
              return;
            }
          } else if (socket.data.role === 'worker' && socket.data.workerId) {
            const w = await Worker.findById(socket.data.workerId).select('status').lean();
            if (!w || w.status === 'suspended') {
              logger.warn({ workerId: socket.data.workerId }, 'Active socket worker was suspended');
              socket.emit('socket_error', { message: 'Account suspended' });
              socket.disconnect(true);
              return;
            }
          } else if (socket.data.role === 'seller' && socket.data.sellerId) {
            const s = await Seller.findById(socket.data.sellerId).select('status').lean();
            if (!s || s.status === 'suspended') {
              logger.warn({ sellerId: socket.data.sellerId }, 'Active socket seller was suspended');
              socket.emit('socket_error', { message: 'Account suspended' });
              socket.disconnect(true);
              return;
            }
          }
        } catch (_) {}
      }, 5 * 60 * 1000);
      socket.on('disconnect', () => clearInterval(revocationCheck));
    }

    socket.on('join_booking', async (id) => {
      if (!id) return;
      const bookingId = String(id);
      if (!socket.data.authenticated) {
        return socket.emit('socket_error', { message: 'Not authorized' });
      }
      await joinBookingRoomIfAuthorized(socket, bookingId);
    });

    socket.on('leave_booking', (id) => {
      if (!id) return;
      socket.leave(`booking_${id}`);
      socket.data.pendingBookingJoins = (socket.data.pendingBookingJoins || []).filter(
        (b) => b !== String(id)
      );
    });

    // Customer room: backwards compatibility for join_customer event, strictly rejecting ID mismatch
    socket.on('join_customer', async (id) => {
      if (!socket.data.authenticated || socket.data.role !== 'customer') {
        return socket.emit('socket_error', { message: 'Not authorized' });
      }
      const requestedId = id ? String(id) : null;
      if (requestedId && requestedId !== socket.data.customerId) {
        return socket.emit('socket_error', { message: 'Not authorized for this customer room' });
      }
      socket.join(`customer_${socket.data.customerId}`);

      const pending = socket.data.pendingBookingJoins || [];
      socket.data.pendingBookingJoins = [];
      for (const bookingId of pending) {
        await joinBookingRoomIfAuthorized(socket, bookingId);
      }
    });

    socket.on('leave_customer_session', () => {
      Array.from(socket.rooms).forEach((r) => {
        if (r.startsWith('customer_') || r.startsWith('booking_') || r.startsWith('seller_') || r.startsWith('worker_')) {
          socket.leave(r);
        }
      });
      socket.data.authenticated = false;
      socket.data.customerId = null;
      socket.data.sellerId = null;
      socket.data.workerId = null;
      socket.data.userId = null;
      socket.data.role = 'guest';
      socket.userId = null;
      socket.customerId = null;
      socket.sellerId = null;
      socket.workerId = null;
      socket.role = 'guest';
      socket.data.pendingBookingJoins = [];
    });

    socket.on('join_worker', (id) => {
      if (!socket.data.authenticated || socket.data.role !== 'worker') {
        return socket.emit('socket_error', { message: 'Not authorized' });
      }
      const requestedId = id ? String(id) : null;
      if (requestedId && requestedId !== socket.data.workerId) {
        return socket.emit('socket_error', { message: 'Not authorized for this worker room' });
      }
      socket.join(`worker_${socket.data.workerId}`);
    });

    socket.on('join_seller', (id) => {
      if (!socket.data.authenticated || socket.data.role !== 'seller') {
        return socket.emit('socket_error', { message: 'Not authorized' });
      }
      const requestedId = id ? String(id) : null;
      if (requestedId && requestedId !== socket.data.sellerId) {
        return socket.emit('socket_error', { message: 'Not authorized for this seller room' });
      }
      socket.join(`seller_${socket.data.sellerId}`);
      logger.info({ sellerId: socket.data.sellerId }, 'Seller joined room');
    });

    // Public rooms open to all clients
    socket.on('join_workers_watch', () => socket.join('workers_watch_room'));
    socket.on('join_products',      () => socket.join('products_room'));

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
        io.to('workers_watch_room').emit('worker_updated', {
          operationType: c.operationType,
          workerId:      c.documentKey._id.toString(),
          fullDocument:  sanitizeWorkerForWatch(c.fullDocument),
        });
      });
      workerStream.on('error', () => setTimeout(startWatching, 5000));

      const bookingStream = db.collection('bookings').watch([], { fullDocument: 'updateLookup' });
      bookingStream.on('change', (c) => {
        const bookingId  = c.documentKey._id.toString();
        const doc        = c.fullDocument;
        const status     = doc?.status;
        const userId     = doc?.user?.toString();

        // Build a lightweight booking snapshot from the change stream document.
        // This lets the customer store update local state instantly without
        // making an HTTP round-trip that would hit a stale Redis cache.
        const bookingSnapshot = doc ? {
          _id:          bookingId,
          status:       doc.status,
          user:         doc.user?.toString(),
          category:     doc.category,
          area:         doc.area,
          city:         doc.city,
          total:        doc.total,
          paymentMethod: doc.paymentMethod,
          bookingType:  doc.bookingType,
          workers:      doc.workers || [],
          workerSnapshot: doc.workerSnapshot || [],
          isAutobook:   doc.isAutobook || false,
          workerStatuses: (doc.workerStatuses || []).map((w) => ({
            ...w,
            worker: w.worker?.toString(),
          })),
          workerCancelled: doc.workerCancelled || false,
          isImmediate:  doc.isImmediate,
          requiredWorkers: doc.requiredWorkers,
          address:      doc.address,
          latitude:     doc.latitude,
          longitude:    doc.longitude,
          subtotal:     doc.subtotal,
          platformFee:  doc.platformFee,
          createdAt:    doc.createdAt,
          updatedAt:    doc.updatedAt,
          acceptedAt:   doc.acceptedAt,
          checkInTime:  doc.checkInTime,
          checkOutTime: doc.checkOutTime,
          issueReport:  doc.issueReport,
          paymentStatus:   doc.paymentStatus,
          cashCollected:   doc.cashCollected,
          cashCollectedAt: doc.cashCollectedAt,
          paidAt:          doc.paidAt,
        } : null;

        // Notify the specific customer who owns this booking (StatusScreen list)
        if (userId) {
          io.to(`customer_${userId}`).emit('booking_updated', {
            customerId:      userId,
            operationType:   c.operationType,
            bookingId,
            status,
            bookingSnapshot,
          });
        }

        // ── Quick Auto Book: detect a worker finishing their own part ──────
        // For autobook bookings the top-level `status` never passes through
        // 'awaiting_customer_confirmation' — only that individual worker's
        // entry inside workerStatuses[] does. The worker app's own (separate)
        // backend deployment emits 'worker_completion_requested' for this,
        // but that only reaches this server if both deployments share the
        // same Redis adapter instance — not guaranteed. Detect it directly
        // here instead, from this server's own change stream, so the
        // customer's popup fires reliably regardless of the other service.
        if (
          userId &&
          doc?.isAutobook &&
          c.operationType === 'update' &&
          c.updateDescription?.updatedFields
        ) {
          const updatedFields = c.updateDescription.updatedFields;
          const justCompletedIdx = Object.keys(updatedFields)
            .map((k) => k.match(/^workerStatuses\.(\d+)\.status$/))
            .filter(Boolean)
            .find((m) => updatedFields[m[0]] === 'awaiting_customer_confirmation');

          if (justCompletedIdx) {
            const entry = (doc.workerStatuses || [])[Number(justCompletedIdx[1])];
            if (entry) {
              io.to(`customer_${userId}`).emit('worker_completion_requested', {
                customerId: userId,
                bookingId,
                workerId: entry.worker?.toString() || null,
                workerName: entry.workerSnapshot?.name || entry.workerSnapshot?.fullName || 'Your worker',
              });
            }
          }
        }

        // ── Manual booking: detect a labour accepting / cancelling ────────
        // Manual (non-autobook) bookings flip a single top-level `status`
        // directly (no per-worker sub-status like autobook), so seeing it
        // change to 'accepted' or 'cancelled' here always means a labour on
        // this manual job just acted on it — covers both immediate and
        // scheduled manual bookings. `workerCancelled` is only ever set by
        // the worker app's cancel action, so it's what distinguishes a
        // worker-initiated cancellation from the customer cancelling their
        // own still-pending request (which must NOT trigger this popup).
        if (
          userId &&
          !doc?.isAutobook &&
          c.operationType === 'update' &&
          c.updateDescription?.updatedFields &&
          Object.prototype.hasOwnProperty.call(c.updateDescription.updatedFields, 'status')
        ) {
          const newStatus   = c.updateDescription.updatedFields.status;
          const workerNames = (doc.workerSnapshot || [])
            .map((w) => w?.name || w?.fullName)
            .filter(Boolean);

          if (newStatus === 'accepted' && doc.status === 'accepted') {
            io.to(`customer_${userId}`).emit('manual_labour_accepted', {
              customerId:  userId,
              bookingId,
              category:    doc.category,
              isImmediate: doc.isImmediate,
              workers:     workerNames,
            });
          } else if (newStatus === 'cancelled' && doc.status === 'cancelled' && doc.workerCancelled) {
            io.to(`customer_${userId}`).emit('manual_labour_cancelled', {
              customerId:  userId,
              bookingId,
              category:    doc.category,
              isImmediate: doc.isImmediate,
              workers:     workerNames,
            });
          }
        }

        // Notify booking-specific room (BookingTrackingScreen detail)
        io.to(`booking_${bookingId}`).emit('booking_status_changed', {
          customerId: userId,
          bookingId,
          status,
          bookingSnapshot,
          isAutobook: doc?.isAutobook || false,
          // Emit work_completion_requested inline so the customer tracking screen
          // reacts immediately when labour marks work done — no separate event needed.
          // (For autobook bookings this coarse flag is unused; per-worker
          // completion goes through the dedicated worker_completion_requested event.)
          isWorkCompletion: status === 'awaiting_customer_confirmation' && !doc?.isAutobook,
        });
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
          customerId: doc.customer?.toString(),
          orderId: c.documentKey._id.toString(),
          status:  doc.status,
        });
      });
      sellerOrderStream.on('error', () => setTimeout(startWatching, 5000));

      const productStream = db.collection('products').watch([], { fullDocument: 'updateLookup' });
      productStream.on('change', (c) => {
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