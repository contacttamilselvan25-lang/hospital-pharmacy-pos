/**
 * Authentication & Authorization Integration Test Suite
 * Tests:
 * 1. Admin login & JWT verification
 * 2. Cashier login & JWT verification
 * 3. Invalid credentials handling (401)
 * 4. Missing inputs validation (400)
 * 5. Protected profile route (/api/auth/me)
 * 6. Admin-only route authorization (200 for Admin)
 * 7. Admin-only route blocking Cashier (403 for Cashier)
 * 8. Cashier-only route authorization
 * 9. Audit log recording of login events
 */

const db = require('../db/connection');

const BASE_URL = 'http://localhost:5000/api/auth';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 Starting Authentication & Authorization Tests...\n');

  let adminToken = null;
  let cashierToken = null;

  // 1. Admin Login (with passkey 2306324052)
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123', passkey: '2306324052' })
    });
    const data = await res.json();
    assert(res.status === 200, 'Admin login with passkey 2306324052 returned HTTP 200');
    assert(data.token && typeof data.token === 'string', 'Admin login returned valid JWT string');
    assert(data.user && data.user.role === 'admin', 'Admin user payload has role "admin"');
    adminToken = data.token;
  } catch (err) {
    assert(false, `Admin login threw error: ${err.message}`);
  }

  // 2. Cashier Login (with passkey 1111)
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'cashier01', password: 'cashier123', passkey: '1111' })
    });
    const data = await res.json();
    assert(res.status === 200, 'Cashier login with passkey 1111 returned HTTP 200');
    assert(data.token && typeof data.token === 'string', 'Cashier login returned valid JWT string');
    assert(data.user && data.user.role === 'cashier', 'Cashier user payload has role "cashier"');
    cashierToken = data.token;
  } catch (err) {
    assert(false, `Cashier login threw error: ${err.message}`);
  }

  // 3. Admin with WRONG Passkey (Blocked 401)
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123', passkey: 'wrong_passkey' })
    });
    assert(res.status === 401, 'Admin with wrong passkey rejected with HTTP 401');
  } catch (err) {
    assert(false, `Wrong passkey test threw error: ${err.message}`);
  }

  // 4. Missing Passkey (Blocked 400)
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    assert(res.status === 400, 'Missing passkey rejected with HTTP 400');
  } catch (err) {
    assert(false, `Missing passkey test threw error: ${err.message}`);
  }

  // 5. Wrong Password
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'incorrect_password', passkey: '2306324052' })
    });
    assert(res.status === 401, 'Wrong password rejected with HTTP 401');
  } catch (err) {
    assert(false, `Wrong password test threw error: ${err.message}`);
  }

  // 6. Nonexistent User
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ghost_pharmacist', password: 'password', passkey: '0000' })
    });
    assert(res.status === 401, 'Nonexistent user rejected with HTTP 401');
  } catch (err) {
    assert(false, `Nonexistent user test threw error: ${err.message}`);
  }

  // 6. Access /api/auth/me with Admin token
  try {
    const res = await fetch(`${BASE_URL}/me`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'GET /api/auth/me allowed with valid Bearer token');
    assert(data.user && data.user.username === 'admin', 'Profile returns correct username');
  } catch (err) {
    assert(false, `/me with token threw error: ${err.message}`);
  }

  // 7. Access /api/auth/me without token (Unauthorized)
  try {
    const res = await fetch(`${BASE_URL}/me`);
    assert(res.status === 401, 'GET /api/auth/me without token rejected with HTTP 401');
  } catch (err) {
    assert(false, `/me without token threw error: ${err.message}`);
  }

  // 8. Admin-Only Endpoint Accessed by Admin (Allowed)
  try {
    const res = await fetch(`${BASE_URL}/admin-only`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'Admin successfully accessed Admin-only protected route (HTTP 200)');
  } catch (err) {
    assert(false, `Admin-only by admin threw error: ${err.message}`);
  }

  // 9. Admin-Only Endpoint Accessed by Cashier (Blocked 403 Forbidden!)
  try {
    const res = await fetch(`${BASE_URL}/admin-only`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    assert(res.status === 403, 'Cashier blocked from Admin-only protected route with HTTP 403 Forbidden');
  } catch (err) {
    assert(false, `Admin-only by cashier threw error: ${err.message}`);
  }

  // 10. Cashier-Only Endpoint Accessed by Cashier (Allowed)
  try {
    const res = await fetch(`${BASE_URL}/cashier-only`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    assert(res.status === 200, 'Cashier successfully accessed Cashier-only protected route (HTTP 200)');
  } catch (err) {
    assert(false, `Cashier-only by cashier threw error: ${err.message}`);
  }

  // 11. Verify Audit Logs Recorded Logins
  const loginAudits = db.prepare(`
    SELECT * FROM audit_logs WHERE action = 'LOGIN' ORDER BY id DESC LIMIT 5
  `).all();
  assert(loginAudits.length >= 2, `Audit logs successfully recorded login actions (${loginAudits.length} found)`);

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('🎉 ALL AUTHENTICATION & AUTHORIZATION TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.error('⚠️ SOME TESTS FAILED!\n');
    process.exit(1);
  }
}

runTests();
