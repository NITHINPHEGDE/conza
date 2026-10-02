/**
 * helpers.js — shared utilities for socket security tests
 *
 * Creates JWT tokens and socket connections exactly the way Conza frontends do,
 * giving the test suite full control over which identity each socket presents.
 *
 * IMPORTANT: Never import this from production code.
 */

'use strict';

const jwt    = require('jsonwebtoken');
const { io } = require('socket.io-client');

// ── Token factories ──────────────────────────────────────────────────────────

/**
 * Build a valid JWT payload identical to what the Conza auth controllers produce.
 *
 * @param {string} id       – MongoDB ObjectId string of the user/worker/seller
 * @param {string} role     – 'customer' | 'worker' | 'seller'
 * @param {string} secret   – the backend's JWT_SECRET
 * @param {object} opts     – extra jwt.sign options (e.g. { expiresIn: '-1s' } for expired)
 */
const makeToken = (id, role, secret, opts = {}) =>
  jwt.sign({ id, role }, secret, { expiresIn: '1h', ...opts });

/**
 * Build an EXPIRED token (exp in the past).
 */
const makeExpiredToken = (id, role, secret) =>
  makeToken(id, role, secret, { expiresIn: '-1s' });

// ── Socket factory ───────────────────────────────────────────────────────────

/**
 * Create and optionally connect a socket.io client.
 *
 * @param {string}  url   – backend URL
 * @param {string|null} token – JWT to send in handshake.auth; null → no token (guest)
 * @returns socket instance (not yet connected — call socket.connect())
 */
const makeSocket = (url, token) => {
  const authPayload = token ? { token } : {};
  return io(url, {
    auth:       authPayload,
    transports: ['websocket'],
    autoConnect: false,
    reconnection: false,       // manual for test determinism
    timeout:    5000,
  });
};

// ── Test harness ─────────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;
const results = [];

/**
 * Run a single test case.
 *
 * @param {string}   name     – human-readable test name
 * @param {Function} fn       – async function that must call pass() or fail()
 */
const test = async (name, fn) => {
  let resolved = false;
  const pass = (note = '') => {
    if (resolved) return;
    resolved = true;
    passCount++;
    results.push({ status: 'PASS', name, note });
    console.log(`  ✅ PASS  ${name}${note ? ' — ' + note : ''}`);
  };
  const fail = (note = '') => {
    if (resolved) return;
    resolved = true;
    failCount++;
    results.push({ status: 'FAIL', name, note });
    console.error(`  ❌ FAIL  ${name}${note ? ' — ' + note : ''}`);
  };

  try {
    await fn(pass, fail);
    // If fn returns without resolving, mark as fail
    if (!resolved) fail('test did not resolve pass or fail within timeout');
  } catch (err) {
    fail(`threw: ${err.message}`);
  }
};

/**
 * Wait at most `ms` milliseconds for a socket event matching `eventName`.
 * Resolves with the event payload, or rejects on timeout.
 */
const waitForEvent = (socket, eventName, ms = 4000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for "${eventName}"`)), ms);
    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

/**
 * Wait for the socket to connect, or reject on connect_error.
 */
const waitForConnect = (socket, ms = 4000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Connection timeout')), ms);
    socket.once('connect', () => { clearTimeout(timer); resolve(); });
    socket.once('connect_error', (err) => { clearTimeout(timer); reject(err); });
  });

/**
 * Print a final summary and exit with appropriate code.
 */
const summary = () => {
  console.log('\n' + '─'.repeat(60));
  console.log(`Results: ${passCount} passed, ${failCount} failed`);
  if (failCount > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r =>
      console.log(`  ❌ ${r.name}${r.note ? ' — ' + r.note : ''}`)
    );
  }
  console.log('─'.repeat(60));
  process.exit(failCount > 0 ? 1 : 0);
};

module.exports = {
  makeToken,
  makeExpiredToken,
  makeSocket,
  waitForConnect,
  waitForEvent,
  test,
  summary,
};
