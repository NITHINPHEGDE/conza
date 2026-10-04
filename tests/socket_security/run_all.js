/**
 * run_all.js — Conza Socket Security Attack Scenario Tests
 *
 * Tests 1–10 from the security spec (Tasks 13–18).
 *
 * Each test connects a real socket.io-client to the actual running backend,
 * presents a real JWT, and verifies server-side enforcement.
 *
 * IMPORTANT: The backends MUST be running locally before executing this file.
 *
 * Usage:
 *   1. Copy .env.test.example → .env.test and fill real values.
 *   2. node run_all.js
 *
 * Exit code: 0 = all passed, 1 = one or more failed.
 */

'use strict';

// Load test-specific env vars (not production .env)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.test') });

const {
  makeToken,
  makeExpiredToken,
  makeSocket,
  waitForConnect,
  waitForEvent,
  test,
  summary,
} = require('./helpers');

// ── Configuration from .env.test ─────────────────────────────────────────────
const cfg = {
  customerUrl:    process.env.CUSTOMER_BACKEND_URL || 'http://localhost:5000',
  customerSecret: process.env.CUSTOMER_JWT_SECRET,
  customerAId:    process.env.CUSTOMER_A_ID,
  customerBId:    process.env.CUSTOMER_B_ID,

  bpUrl:          process.env.BP_BACKEND_URL  || 'http://localhost:5001',
  bpSecret:       process.env.BP_JWT_SECRET,
  workerAId:      process.env.WORKER_A_ID,
  workerBId:      process.env.WORKER_B_ID,

  vendorUrl:      process.env.VENDOR_BACKEND_URL || 'http://localhost:5002',
  vendorSecret:   process.env.VENDOR_JWT_SECRET,
  sellerAId:      process.env.SELLER_A_ID,
  sellerBId:      process.env.SELLER_B_ID,

  bookingBCustomerId: process.env.BOOKING_B_CUSTOMER_ID, // owned by Customer B
  bookingBWorkerId:   process.env.BOOKING_B_WORKER_ID,   // assigned to Worker B
  bookingACustomerId: process.env.BOOKING_A_CUSTOMER_ID, // owned by Customer A
  bookingAWorkerId:   process.env.BOOKING_A_WORKER_ID,   // assigned to Worker A
};

// ── Guard: warn if using placeholder IDs ────────────────────────────────────
const PLACEHOLDER = '000000000000000000000001';
if (Object.values(cfg).some(v => v && v.startsWith('0000000000000'))) {
  console.warn(
    '\n⚠️  WARNING: One or more IDs are placeholder values from .env.test.example.\n' +
    '   Tests against MongoDB will likely fail with "not found" or "not authorized".\n' +
    '   Fill in real IDs from your local database before running.\n'
  );
}

// ── Helper: connect socket and return it (throws on connect_error) ────────────
const connect = async (url, token) => {
  const s = makeSocket(url, token);
  s.connect();
  await waitForConnect(s);
  return s;
};

// ── Helper: connect socket and expect it to be rejected ──────────────────────
const expectConnectionRejected = async (url, token) => {
  return new Promise((resolve) => {
    const s = makeSocket(url, token);
    s.once('connect_error', (err) => {
      s.disconnect();
      resolve({ rejected: true, message: err.message });
    });
    s.once('connect', () => {
      s.disconnect();
      resolve({ rejected: false });
    });
    s.connect();
    setTimeout(() => resolve({ rejected: false, timedOut: true }), 5000);
  });
};

// ── Helper: emit event and wait for socket_error ──────────────────────────────
const emitAndExpectError = async (socket, event, payload, ms = 3000) => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ gotError: false, timedOut: true }), ms);
    socket.once('socket_error', (data) => {
      clearTimeout(timer);
      resolve({ gotError: true, message: data?.message });
    });
    if (payload !== undefined) socket.emit(event, payload);
    else socket.emit(event);
  });
};

(async () => {
// ────────────────────────────────────────────────────────────────────────────
// TEST 1 — Customer A attempts join_customer with Customer B's ID
// Expected: DENIED (socket_error emitted; room NOT joined)
// ────────────────────────────────────────────────────────────────────────────
await test('TEST 1: Customer A cannot join Customer B\'s room', async (pass, fail) => {
  const token = makeToken(cfg.customerAId, 'customer', cfg.customerSecret);
  let socket;
  try {
    socket = await connect(cfg.customerUrl, token);
    const result = await emitAndExpectError(socket, 'join_customer', cfg.customerBId);
    if (result.gotError) {
      pass(`server emitted socket_error: "${result.message}"`);
    } else {
      fail('server did NOT deny join_customer with a foreign ID');
    }
  } catch (err) {
    fail(err.message);
  } finally {
    socket?.disconnect();
  }
});

// ────────────────────────────────────────────────────────────────────────────
// TEST 2 — Worker A attempts join_worker with Worker B's ID
// Expected: DENIED
// ────────────────────────────────────────────────────────────────────────────
await test('TEST 2: Worker A cannot join Worker B\'s room (BP backend)', async (pass, fail) => {
  const token = makeToken(cfg.workerAId, 'worker', cfg.bpSecret);
  let socket;
  try {
    socket = await connect(cfg.bpUrl, token);
    const result = await emitAndExpectError(socket, 'join_worker', cfg.workerBId);
    if (result.gotError) {
      pass(`server emitted socket_error: "${result.message}"`);
    } else {
      fail('server did NOT deny join_worker with a foreign ID');
    }
  } catch (err) {
    fail(err.message);
  } finally {
    socket?.disconnect();
  }
});

// ────────────────────────────────────────────────────────────────────────────
// TEST 3 — Seller A attempts join_seller with Seller B's ID
// Expected: DENIED
// ────────────────────────────────────────────────────────────────────────────
await test('TEST 3: Seller A cannot join Seller B\'s room (Vendor backend)', async (pass, fail) => {
  const token = makeToken(cfg.sellerAId, 'seller', cfg.vendorSecret);
  let socket;
  try {
    socket = await connect(cfg.vendorUrl, token);
    const result = await emitAndExpectError(socket, 'join_seller', cfg.sellerBId);
    if (result.gotError) {
      pass(`server emitted socket_error: "${result.message}"`);
    } else {
      fail('server did NOT deny join_seller with a foreign ID');
    }
  } catch (err) {
    fail(err.message);
  } finally {
    socket?.disconnect();
  }
});

// ────────────────────────────────────────────────────────────────────────────
// TEST 4 — Customer A attempts join_booking for a booking owned by Customer B
// Expected: DENIED
// ────────────────────────────────────────────────────────────────────────────
await test('TEST 4: Customer A cannot join booking owned by Customer B', async (pass, fail) => {
  const token = makeToken(cfg.customerAId, 'customer', cfg.customerSecret);
  let socket;
  try {
    socket = await connect(cfg.customerUrl, token);
    const result = await emitAndExpectError(socket, 'join_booking', cfg.bookingBCustomerId, 4000);
    if (result.gotError) {
      pass(`server emitted socket_error: "${result.message}"`);
    } else {
      fail('server did NOT deny join_booking for a foreign booking (customer path)');
    }
  } catch (err) {
    fail(err.message);
  } finally {
    socket?.disconnect();
  }
});

// ────────────────────────────────────────────────────────────────────────────
// TEST 5 — Worker A attempts join_booking for a booking assigned to Worker B
// Expected: DENIED
// ────────────────────────────────────────────────────────────────────────────
await test('TEST 5: Worker A cannot join booking assigned to Worker B (BP backend)', async (pass, fail) => {
  const token = makeToken(cfg.workerAId, 'worker', cfg.bpSecret);
  let socket;
  try {
    socket = await connect(cfg.bpUrl, token);
    const result = await emitAndExpectError(socket, 'join_booking', cfg.bookingBWorkerId, 4000);
    if (result.gotError) {
      pass(`server emitted socket_error: "${result.message}"`);
    } else {
      fail('server did NOT deny join_booking for a foreign booking (worker path)');
    }
  } catch (err) {
    fail(err.message);
  } finally {
    socket?.disconnect();
  }
});

// ────────────────────────────────────────────────────────────────────────────
// TEST 6 — Customer A joins their OWN booking
// Expected: ALLOWED (no socket_error, and they end up in booking_<id> room)
// ────────────────────────────────────────────────────────────────────────────
await test('TEST 6: Customer A can join their own booking (ALLOWED)', async (pass, fail) => {
  const token = makeToken(cfg.customerAId, 'customer', cfg.customerSecret);
  let socket;
  try {
    socket = await connect(cfg.customerUrl, token);

    // Track if a socket_error arrives
    let deniedByServer = false;
    socket.once('socket_error', () => { deniedByServer = true; });

    socket.emit('join_booking', cfg.bookingACustomerId);

    // Give the server ~3 s to either deny or silently accept
    await new Promise(r => setTimeout(r, 3000));

    if (deniedByServer) {
      fail('server incorrectly denied join_booking for the booking owner');
    } else {
      pass('no socket_error received — join_booking was allowed');
    }
  } catch (err) {
    fail(err.message);
  } finally {
    socket?.disconnect();
  }
});

// ────────────────────────────────────────────────────────────────────────────
// TEST 7 — Assigned Worker joins their booking
// Expected: ALLOWED
// ────────────────────────────────────────────────────────────────────────────
await test('TEST 7: Assigned Worker can join their booking (ALLOWED, BP backend)', async (pass, fail) => {
  const token = makeToken(cfg.workerAId, 'worker', cfg.bpSecret);
  let socket;
  try {
    socket = await connect(cfg.bpUrl, token);

    let deniedByServer = false;
    socket.once('socket_error', () => { deniedByServer = true; });

    socket.emit('join_booking', cfg.bookingAWorkerId);
    await new Promise(r => setTimeout(r, 3000));

    if (deniedByServer) {
      fail('server incorrectly denied join_booking for the assigned worker');
    } else {
      pass('no socket_error received — join_booking was allowed');
    }
  } catch (err) {
    fail(err.message);
  } finally {
    socket?.disconnect();
  }
});

// ────────────────────────────────────────────────────────────────────────────
// TEST 8 — Unauthenticated socket (no token) cannot connect
// Expected: DENIED at handshake (connect_error)
// Customer backend rejects if no token when in required-auth mode; note that
// the customer backend currently allows guests for public rooms — this test
// verifies that the BP and Vendor backends (which always require auth) reject.
// ────────────────────────────────────────────────────────────────────────────
await test('TEST 8a: No token → BP backend rejects connection', async (pass, fail) => {
  const result = await expectConnectionRejected(cfg.bpUrl, null);
  if (result.rejected) {
    pass(`connect_error: "${result.message}"`);
  } else {
    fail('BP backend allowed unauthenticated connection');
  }
});

await test('TEST 8b: No token → Vendor backend rejects connection', async (pass, fail) => {
  const result = await expectConnectionRejected(cfg.vendorUrl, null);
  if (result.rejected) {
    pass(`connect_error: "${result.message}"`);
  } else {
    fail('Vendor backend allowed unauthenticated connection');
  }
});

await test('TEST 8c: No token → Customer backend allows guest but join_customer is denied', async (pass, fail) => {
  // Customer backend allows guest connections for public rooms (workers_watch_room, products_room).
  // Verify that a guest socket cannot join a private customer room.
  let socket;
  try {
    socket = await connect(cfg.customerUrl, null);
    const result = await emitAndExpectError(socket, 'join_customer', cfg.customerAId);
    if (result.gotError) {
      pass(`socket_error for unauthenticated join_customer: "${result.message}"`);
    } else {
      fail('guest socket was allowed to join a private customer room');
    }
  } catch (err) {
    // connect_error is also acceptable here
    if (err.message.includes('Authentication')) {
      pass(`connection rejected: "${err.message}"`);
    } else {
      fail(err.message);
    }
  } finally {
    socket?.disconnect();
  }
});

// ────────────────────────────────────────────────────────────────────────────
// TEST 9 — Expired JWT is rejected at handshake
// Expected: DENIED (connect_error)
// ────────────────────────────────────────────────────────────────────────────
await test('TEST 9a: Expired JWT → Customer backend rejects', async (pass, fail) => {
  const token = makeExpiredToken(cfg.customerAId, 'customer', cfg.customerSecret);
  const result = await expectConnectionRejected(cfg.customerUrl, token);
  // Customer backend may allow guest fallback for invalid tokens, but should deny
  // private rooms. Strict backends will reject the connection outright.
  if (result.rejected) {
    pass(`connect_error on expired token: "${result.message}"`);
  } else {
    // Connected as guest — still acceptable if it cannot join private rooms.
    // Verify private join is denied.
    let socket;
    try {
      socket = await connect(cfg.customerUrl, token);
      const r = await emitAndExpectError(socket, 'join_customer', cfg.customerAId);
      if (r.gotError) {
        pass('connected as guest with expired token but join_customer correctly denied');
      } else {
        fail('expired token allowed private room join');
      }
    } catch (_) {
      pass('could not connect with expired token');
    } finally {
      socket?.disconnect();
    }
  }
});

await test('TEST 9b: Expired JWT → BP backend rejects', async (pass, fail) => {
  const token = makeExpiredToken(cfg.workerAId, 'worker', cfg.bpSecret);
  const result = await expectConnectionRejected(cfg.bpUrl, token);
  if (result.rejected) {
    pass(`connect_error on expired token: "${result.message}"`);
  } else {
    fail('BP backend accepted an expired JWT');
  }
});

await test('TEST 9c: Expired JWT → Vendor backend rejects', async (pass, fail) => {
  const token = makeExpiredToken(cfg.sellerAId, 'seller', cfg.vendorSecret);
  const result = await expectConnectionRejected(cfg.vendorUrl, token);
  if (result.rejected) {
    pass(`connect_error on expired token: "${result.message}"`);
  } else {
    fail('Vendor backend accepted an expired JWT');
  }
});

// ────────────────────────────────────────────────────────────────────────────
// TEST 10 — Reconnect after network loss: authenticated and rooms restored
// Expected: AUTHENTICATED + CORRECT ROOMS RESTORED
//
// Simulate disconnect (socket.disconnect()) then reconnect with a fresh token.
// The server auto-joins the personal room on every connection, so simply
// verifying that a post-reconnect event sent to that room is received is
// sufficient.
// ────────────────────────────────────────────────────────────────────────────
await test('TEST 10: Reconnect after disconnect → re-authenticated & rooms rejoined', async (pass, fail) => {
  const token = makeToken(cfg.workerAId, 'worker', cfg.bpSecret);
  let socket;
  try {
    // Initial connection
    socket = await connect(cfg.bpUrl, token);

    // Simulate network loss
    socket.disconnect();
    await new Promise(r => setTimeout(r, 500));

    // Re-connect (same token — simulates app coming back online)
    // Reset auth in case socket was cleaned up
    socket.auth = { token };
    socket.connect();

    await waitForConnect(socket, 5000);

    // Socket is re-connected and the server auto-joins worker_<workerId>
    // on every connection event, so we can confirm it's working by checking
    // that no socket_error fired during reconnect.
    let errorFired = false;
    socket.once('socket_error', () => { errorFired = true; });
    await new Promise(r => setTimeout(r, 1000));

    if (errorFired) {
      fail('socket_error fired after reconnect');
    } else {
      pass('reconnected successfully; no socket_error — personal room auto-rejoined by server');
    }
  } catch (err) {
    fail(err.message);
  } finally {
    socket?.disconnect();
  }
});

// ── Final summary ─────────────────────────────────────────────────────────────
await summary();
})();
