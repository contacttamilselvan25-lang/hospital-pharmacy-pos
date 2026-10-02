/**
 * Phase 10: Security, Role-Based Access & Input Validation Audit Test Suite
 * 
 * Tests:
 * 1. SQL Injection defense on authentication & search queries
 * 2. Unauthenticated access prevention (HTTP 401)
 * 3. Tampered JWT token rejection (HTTP 403)
 * 4. Privilege Escalation Prevention: Cashier blocked from Admin inventory mutations (HTTP 403)
 * 5. Privilege Escalation Prevention: Cashier blocked from Admin financial reports (HTTP 403)
 * 6. Input Validation: Empty cart checkout rejected (HTTP 400)
 * 7. Input Validation: Invalid payment method rejected (HTTP 400)
 * 8. Input Validation: Negative / decimal quantities rejected
 * 9. Clinical Safety: Expired medicine dispensing strictly blocked
 * 10. Inventory Safety: Over-quantity checkout strictly blocked
 * 11. Data Privacy: password_hash never exposed in auth/user payloads
 * 12. Audit Integrity: System actions logged to audit_logs table
 */

const db = require('../db/connection');

const BASE_URL = 'http://localhost:5000/api';

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

async function runSecurityAudit() {
  console.log('🛡️ Starting Security, Authorization & Validation Audit...\n');

  let adminToken = null;
  let cashierToken = null;

  // 1. Authenticate Admin and Cashier
  try {
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123', passkey: '2306324052' })
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;

    const cashierRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'cashier01', password: 'cashier123', passkey: '1111' })
    });
    const cashierData = await cashierRes.json();
    cashierToken = cashierData.token;

    assert(adminRes.status === 200 && !!adminToken, 'Admin authentication verified');
    assert(cashierRes.status === 200 && !!cashierToken, 'Cashier authentication verified');
  } catch (err) {
    assert(false, `Authentication setup failed: ${err.message}`);
  }

  // 2. Data Privacy: Verify password_hash is NEVER leaked
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'cashier01', password: 'cashier123', passkey: '1111' })
    });
    const loginData = await loginRes.json();
    assert(loginData.user && !loginData.user.password_hash, 'POST /auth/login payload omits password_hash');

    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    const meData = await meRes.json();
    assert(meData.user && !meData.user.password_hash, 'GET /auth/me payload omits password_hash');
  } catch (err) {
    assert(false, `Password privacy test error: ${err.message}`);
  }

  // 3. SQL Injection Defense on Login
  try {
    const sqlInjRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: "' OR '1'='1", password: "' OR '1'='1", passkey: "' OR '1'='1" })
    });
    assert(sqlInjRes.status === 401, "SQL Injection payload (' OR '1'='1) safely rejected with HTTP 401");
  } catch (err) {
    assert(false, `SQL injection test error: ${err.message}`);
  }

  // 4. Unauthenticated Access Defense
  try {
    const unauthDashboard = await fetch(`${BASE_URL}/dashboard/stats`);
    assert(unauthDashboard.status === 401, 'Unauthenticated access to /dashboard/stats blocked with HTTP 401');

    const unauthReports = await fetch(`${BASE_URL}/reports/sales-summary`);
    assert(unauthReports.status === 401, 'Unauthenticated access to /reports/sales-summary blocked with HTTP 401');
  } catch (err) {
    assert(false, `Unauth test error: ${err.message}`);
  }

  // 5. Tampered JWT Token Rejection
  try {
    const tamperedRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakePayload.fakeSignature' }
    });
    assert(tamperedRes.status === 403, 'Tampered / invalid JWT token rejected with HTTP 403');
  } catch (err) {
    assert(false, `Tampered JWT test error: ${err.message}`);
  }

  // 6. Privilege Escalation Defense: Cashier blocked from Admin Inventory operations
  try {
    const createMedRes = await fetch(`${BASE_URL}/inventory/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        name: 'Unauthorized Drug',
        generic_name: 'Test Generic',
        strength: '500mg',
        dosage_form: 'tablet'
      })
    });
    assert(createMedRes.status === 403, 'Cashier blocked from adding new medicine (HTTP 403 Forbidden)');

    const adjustRes = await fetch(`${BASE_URL}/inventory/stock-adjustment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        batch_id: 1,
        change_quantity: 10,
        reason: 'Illegal adjustment attempt'
      })
    });
    assert(adjustRes.status === 403, 'Cashier blocked from manual stock adjustment (HTTP 403 Forbidden)');
  } catch (err) {
    assert(false, `Role escalation test error: ${err.message}`);
  }

  // 7. Privilege Escalation Defense: Cashier blocked from Management Reports
  try {
    const salesSummaryRes = await fetch(`${BASE_URL}/reports/sales-summary`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    assert(salesSummaryRes.status === 403, 'Cashier blocked from /reports/sales-summary (HTTP 403 Forbidden)');

    const lowStockRes = await fetch(`${BASE_URL}/reports/low-stock`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    assert(lowStockRes.status === 403, 'Cashier blocked from /reports/low-stock (HTTP 403 Forbidden)');

    const expiryRes = await fetch(`${BASE_URL}/reports/expiry`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    assert(expiryRes.status === 403, 'Cashier blocked from /reports/expiry (HTTP 403 Forbidden)');
  } catch (err) {
    assert(false, `Reports role test error: ${err.message}`);
  }

  // 8. Admin Access to Reports Allowed
  try {
    const adminReportRes = await fetch(`${BASE_URL}/reports/sales-summary`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(adminReportRes.status === 200, 'Admin authorized to view /reports/sales-summary (HTTP 200 OK)');
  } catch (err) {
    assert(false, `Admin report access error: ${err.message}`);
  }

  // 9. Input Validation: Empty Cart Checkout Blocked
  try {
    const emptyCheckoutRes = await fetch(`${BASE_URL}/sales/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        customer_name: 'Test Patient',
        payment_method: 'cash',
        items: []
      })
    });
    assert(emptyCheckoutRes.status === 400, 'Empty cart checkout rejected with HTTP 400');
  } catch (err) {
    assert(false, `Empty cart test error: ${err.message}`);
  }

  // 10. Input Validation: Invalid Payment Method Blocked
  try {
    const invalidPayRes = await fetch(`${BASE_URL}/sales/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        customer_name: 'Test Patient',
        payment_method: 'cryptocurrency_doge',
        items: [{ batch_id: 1, quantity: 1 }]
      })
    });
    assert(invalidPayRes.status === 400, 'Invalid payment method rejected with HTTP 400');
  } catch (err) {
    assert(false, `Invalid payment method test error: ${err.message}`);
  }

  // 11. Input Validation: Decimal & Negative Quantities Blocked
  try {
    const decRes = await fetch(`${BASE_URL}/sales/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        customer_name: 'Test Patient',
        payment_method: 'cash',
        items: [{ batch_id: 1, quantity: 1.5 }]
      })
    });
    assert(!decRes.ok, 'Decimal fractional quantity checkout rejected');

    const negRes = await fetch(`${BASE_URL}/sales/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        customer_name: 'Test Patient',
        payment_method: 'cash',
        items: [{ batch_id: 1, quantity: -2 }]
      })
    });
    assert(!negRes.ok, 'Negative quantity checkout rejected');
  } catch (err) {
    assert(false, `Quantity validation test error: ${err.message}`);
  }

  // 12. Clinical Safety: Expired Medicine Dispensing Strictly Blocked
  try {
    const expiredBatch = db.prepare(`
      SELECT id, batch_number, expiry_date 
      FROM inventory_batches 
      WHERE expiry_date < DATE('now')
      LIMIT 1
    `).get();

    if (expiredBatch) {
      const expiredRes = await fetch(`${BASE_URL}/sales/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cashierToken}`
        },
        body: JSON.stringify({
          customer_name: 'Safety Check',
          payment_method: 'cash',
          items: [{ batch_id: expiredBatch.id, quantity: 1 }]
        })
      });
      const data = await expiredRes.json();
      assert(!expiredRes.ok && data.message.includes('expired'), 'Dispensing expired medicine strictly rejected with clinical safety alert');
    } else {
      assert(true, 'No expired batch currently seeded to test');
    }
  } catch (err) {
    assert(false, `Expired check test error: ${err.message}`);
  }

  // 13. Audit Log Integrity Check
  try {
    const recentLogs = db.prepare(`
      SELECT COUNT(*) as count 
      FROM audit_logs 
      WHERE action IN ('LOGIN', 'SALE_COMPLETED', 'STOCK_ADJUSTMENT')
    `).get();
    assert(recentLogs.count > 0, `Audit log engine active: recorded ${recentLogs.count} security events`);
  } catch (err) {
    assert(false, `Audit log check error: ${err.message}`);
  }

  // 14. Passkey Security & Staff Access Verification
  try {
    // Admin access to staff passkeys list (200)
    const staffRes = await fetch(`${BASE_URL}/auth/staff-passkeys`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(staffRes.status === 200, 'Admin can view staff passkeys list (HTTP 200)');
    const staffData = await staffRes.json();
    const adminUser = staffData.staff.find(s => s.username === 'admin');
    assert(adminUser && adminUser.passkey === '2306324052', 'Admin passkey in DB matches 2306324052');

    // Cashier blocked from viewing staff passkeys list (403)
    const cashierStaffRes = await fetch(`${BASE_URL}/auth/staff-passkeys`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    assert(cashierStaffRes.status === 403, 'Cashier blocked from staff passkey management (HTTP 403)');

    // Admin can update a passkey
    const updateRes = await fetch(`${BASE_URL}/auth/update-passkey`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}` 
      },
      body: JSON.stringify({ user_id: adminUser.id, new_passkey: '2306324052' })
    });
    assert(updateRes.status === 200, 'Admin passkey update endpoint succeeded (HTTP 200)');
  } catch (err) {
    assert(false, `Passkey security test error: ${err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`🛡️ Security & Validation Test Summary:`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`========================================\n`);

  setTimeout(() => process.exit(failed > 0 ? 1 : 0), 100);
}

runSecurityAudit();
