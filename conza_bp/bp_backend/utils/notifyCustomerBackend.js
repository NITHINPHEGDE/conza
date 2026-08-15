const logger = require('./logger');

// The customer app's socket connects to the CUSTOMER backend, a completely
// separate deployment from this (BP) backend — each runs its own
// independent Socket.IO server. `io.to(room).emit(...)` here only reaches
// sockets connected to THIS server (i.e. workers), never the customer.
// This relays the event to the customer backend's own Socket.IO server via
// a small internal HTTP endpoint so it can emit it locally, where the
// customer's socket actually lives.
const CUSTOMER_BACKEND_URL =
  process.env.CUSTOMER_BACKEND_INTERNAL_URL ||
  'https://conza-production-88dd.up.railway.app';
const INTERNAL_SOCKET_SECRET = process.env.INTERNAL_SOCKET_SECRET || '';

const notifyCustomerBackend = async (room, event, payload) => {
  try {
    const res = await fetch(`${CUSTOMER_BACKEND_URL}/api/internal/socket-emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': INTERNAL_SOCKET_SECRET,
      },
      body: JSON.stringify({ room, event, payload }),
    });
    if (!res.ok) {
      logger.error({ status: res.status, room, event }, 'Customer backend rejected socket relay');
    }
  } catch (err) {
    logger.error({ err: err.message, room, event }, 'Failed to relay socket event to customer backend');
  }
};

module.exports = { notifyCustomerBackend };
