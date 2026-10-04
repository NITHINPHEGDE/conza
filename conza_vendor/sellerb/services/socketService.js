// conzasb/services/socketService.js
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const { verifyToken } = require('../utils/jwt');
const Seller     = require('../models/Seller');

// Minimal safe logger — replace with your structured logger if available.
// Never surfaces internal details (stack traces, IDs, secrets) to clients.
const log = {
  info:  (...a) => console.info('[SellerSocket]', ...a),
  warn:  (...a) => console.warn('[SellerSocket]', ...a),
  error: (...a) => console.error('[SellerSocket]', ...a),
};

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],  // allow polling fallback
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── Handshake Authentication ──────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
        log.warn('Connection rejected: token missing');
        return next(new Error('Authentication required'));
      }

      const token = rawToken.trim();
      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (err) {
        log.warn('Auth failed: invalid or expired token');
        return next(new Error('Authentication failed'));
      }

      if (!decoded || !decoded.id) {
        return next(new Error('Authentication failed'));
      }

      const seller = await Seller.findById(decoded.id).select('-password').lean();
      if (!seller || seller.status === 'suspended') {
        log.warn('Auth rejected: seller not found or suspended');
        return next(new Error('Authentication failed'));
      }

      const sellerId = seller._id.toString();
      socket.data.authenticated = true;
      socket.data.userId        = sellerId;
      socket.data.sellerId      = sellerId;
      socket.data.role          = 'seller';
      socket.data.tokenExp      = decoded.exp;
      socket.data.authToken     = token;
      socket.userId             = sellerId;
      socket.sellerId           = sellerId;
      socket.role               = 'seller';
      socket.seller             = seller;
      return next();
    } catch (err) {
      log.error('Handshake authentication error');
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    log.info('Seller connected', { socketId: socket.id });

    // Automatically join the seller's private room
    socket.join(`seller_${socket.sellerId}`);
    log.info('Seller auto-joined private room');

    // ── Enforce Token Expiry on Connected Socket ──────────────────────────
    if (socket.data.tokenExp) {
      const remainingMs = (socket.data.tokenExp * 1000) - Date.now();
      if (remainingMs > 0 && remainingMs < 0x7FFFFFFF) {
        const expiryTimer = setTimeout(() => {
          log.info('Session expired (JWT exp)');
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

    // ── Periodic Suspension Check (every 5 min) ───────────────────────────
    const revocationCheck = setInterval(async () => {
      if (!socket.connected || !socket.data.authenticated) return;
      try {
        const s = await Seller.findById(socket.sellerId).select('status').lean();
        if (!s || s.status === 'suspended') {
          log.warn('Active seller was suspended — disconnecting');
          socket.emit('socket_error', { message: 'Account suspended' });
          socket.disconnect(true);
        }
      } catch (_) {}
    }, 5 * 60 * 1000);
    socket.on('disconnect', () => clearInterval(revocationCheck));

    // Backwards compatibility for join_seller event, strictly rejecting ID mismatch
    socket.on('join_seller', (id) => {
      const requestedId = id ? String(id) : null;
      if (requestedId && requestedId !== socket.sellerId) {
        return socket.emit('socket_error', { message: 'Not authorized for this seller room' });
      }
      socket.join(`seller_${socket.sellerId}`);
    });

    // Reject unauthorized room join requests
    socket.on('join_customer', () => socket.emit('socket_error', { message: 'Not authorized' }));
    socket.on('join_worker',   () => socket.emit('socket_error', { message: 'Not authorized' }));

    socket.on('disconnect', () => {
      log.info('Seller disconnected');
    });
  });

  watchChanges();
  return io;
};

const watchChanges = () => {
  const db = mongoose.connection;

  const startWatching = () => {
    log.info('Watching seller collections for changes...');

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
      log.error('Change streams failed — MongoDB must run as a replica set or use Atlas');
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