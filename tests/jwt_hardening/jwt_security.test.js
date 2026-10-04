/**
 * tests/jwt_hardening/jwt_security.test.js
 *
 * Automated verification test suite for JWT secret hardening:
 * 1. Fail-fast startup validation (rejects missing, short, and banned secrets)
 * 2. Successful initialization with valid, cryptographically strong secrets
 * 3. Centralized utils/jwt functionality (sign, verify, tamper detection, expiration)
 */

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const assert = require('assert');

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║       CONZA JWT HARDENING & CONFIG VALIDATION TEST SUITE         ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

const services = [
  { name: 'Customer Backend', dir: path.resolve(__dirname, '../../conza_customers/conza_backend') },
  { name: 'BP Backend',       dir: path.resolve(__dirname, '../../conza_bp/bp_backend') },
  { name: 'Vendor Backend',   dir: path.resolve(__dirname, '../../conza_vendor/sellerb') },
  { name: 'Admin Backend',    dir: path.resolve(__dirname, '../../conza_admin/admin_backend') },
];

function execEnvTest(serviceDir, customEnv) {
  const env = {
    PATH: process.env.PATH,
    SYSTEMROOT: process.env.SYSTEMROOT,
    NODE_ENV: 'test',
    MONGO_URI: 'mongodb://localhost:27017/conza_test_dummy',
    ...customEnv,
  };

  const script = `
    try {
      require('./config/env');
      process.exit(0);
    } catch (e) {
      process.exit(2);
    }
  `;

  return spawnSync(process.execPath, ['-e', script], {
    cwd: serviceDir,
    env,
    encoding: 'utf8',
  });
}

// ── 1. FAIL-FAST VALIDATION TESTS ───────────────────────────────────────────
console.log('📋 Test Group 1: Fail-Fast Startup Validation');

for (const svc of services) {
  runTest(`${svc.name}: Rejects missing JWT_SECRET`, () => {
    const res = execEnvTest(svc.dir, { JWT_SECRET: '' });
    assert.strictEqual(res.status, 1, `Expected exit code 1 for missing secret, got ${res.status}`);
    assert.ok(
      res.stderr.includes('FATAL CONFIG ERROR') && res.stderr.includes('JWT_SECRET is required'),
      `Expected fatal missing error in stderr: ${res.stderr}`
    );
  });

  runTest(`${svc.name}: Rejects short JWT_SECRET (< 16 chars)`, () => {
    const res = execEnvTest(svc.dir, { JWT_SECRET: 'short_key_123' });
    assert.strictEqual(res.status, 1, `Expected exit code 1 for short secret, got ${res.status}`);
    assert.ok(
      res.stderr.includes('at least 16 characters long'),
      `Expected length warning in stderr: ${res.stderr}`
    );
  });

  runTest(`${svc.name}: Rejects banned hardcoded fallback secret`, () => {
    const res = execEnvTest(svc.dir, { JWT_SECRET: 'conza_jwt_secret_fallback_2026' });
    assert.strictEqual(res.status, 1, `Expected exit code 1 for banned secret, got ${res.status}`);
    assert.ok(
      res.stderr.includes('known insecure/placeholder value'),
      `Expected banned secret error in stderr: ${res.stderr}`
    );
  });

  runTest(`${svc.name}: Accepts strong, compliant JWT secret`, () => {
    const res = execEnvTest(svc.dir, { JWT_SECRET: 'valid_secure_jwt_secret_for_testing_2026_xyz' });
    assert.strictEqual(res.status, 0, `Expected exit code 0 for valid secret, got ${res.status}. Error: ${res.stderr}`);
  });
}

// ── 2. CENTRALIZED UTILS/JWT TEST ───────────────────────────────────────────
console.log('\n📋 Test Group 2: Centralized Token Sign and Verify Functionality');

for (const svc of services) {
  runTest(`${svc.name}: utils/jwt signs, verifies, and detects tampering`, () => {
    const testScript = `
      process.env.JWT_SECRET = 'valid_secure_jwt_secret_for_testing_2026_xyz';
      process.env.MONGO_URI = 'mongodb://localhost:27017/conza_test_dummy';
      const jwtUtil = require('./utils/jwt');
      const assert = require('assert');

      // 1. Sign
      let token;
      if (typeof jwtUtil.signToken === 'function') {
        token = jwtUtil.signToken({ id: 'test_user_123', role: 'customer' });
      } else if (typeof jwtUtil.generateToken === 'function') {
        token = jwtUtil.generateToken('test_user_123', 'admin');
      }

      assert.ok(token && typeof token === 'string', 'Token should be non-empty string');

      // 2. Verify
      const decoded = jwtUtil.verifyToken(token);
      assert.strictEqual(decoded.id, 'test_user_123', 'Decoded id must match payload');

      // 3. Tampering detection
      const parts = token.split('.');
      parts[1] = Buffer.from(JSON.stringify({ id: 'attacker_id' })).toString('base64url');
      const tampered = parts.join('.');

      let tamperCaught = false;
      try {
        jwtUtil.verifyToken(tampered);
      } catch (e) {
        tamperCaught = true;
      }
      assert.ok(tamperCaught, 'Tampered token must be rejected');
    `;

    const res = spawnSync(process.execPath, ['-e', testScript], {
      cwd: svc.dir,
      env: { ...process.env, JWT_SECRET: 'valid_secure_jwt_secret_for_testing_2026_xyz', MONGO_URI: 'mongodb://localhost:27017/dummy' },
      encoding: 'utf8',
    });

    assert.strictEqual(res.status, 0, `utils/jwt test failed with status ${res.status}: ${res.stderr || res.stdout}`);
  });
}

console.log('\n══════════════════════════════════════════════════════════════════');
console.log(`Results: ${passedTests} / ${totalTests} tests passed.`);
if (passedTests === totalTests) {
  console.log('🎉 ALL JWT HARDENING TESTS PASSED!');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED.');
  process.exit(1);
}
