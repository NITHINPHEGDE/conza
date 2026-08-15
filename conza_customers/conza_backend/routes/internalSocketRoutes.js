const express = require('express');
const router  = express.Router();
const { getIO } = require('../services/socketService');

// Internal-only endpoint used by the BP (worker) backend to relay socket
// events into THIS server's Socket.IO instance. The BP and customer apps
// are two separate deployments with two separate Socket.IO servers, so a
// room emit on the BP backend's `io` never reaches a customer socket
// connected here — this bridges that gap.
router.post('/socket-emit', (req, res) => {
  const secret = req.headers['x-internal-secret'];
  if (!process.env.INTERNAL_SOCKET_SECRET || secret !== process.env.INTERNAL_SOCKET_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { room, event, payload } = req.body || {};
  if (!room || !event) {
    return res.status(400).json({ success: false, message: 'room and event are required' });
  }

  try {
    const io = getIO();
    io.to(room).emit(event, payload || {});
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
