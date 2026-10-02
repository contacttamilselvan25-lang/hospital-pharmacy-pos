/**
 * Reports & Sales Analytics Integration Test Suite
 */

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

async function runTests() {
  console.log('🧪 Starting Reports & Sales Analytics Tests...\n');

  let adminToken = null;

  // 1. Authenticate Admin
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123', passkey: '2306324052' })
    });
    const data = await res.json();
    adminToken = data.token;
    assert(!!adminToken, 'Admin authenticated and obtained JWT');
  } catch (err) {
    assert(false, `Admin login failed: ${err.message}`);
  }

  // 2. Test Unauthenticated Access Blocked
  try {
    const res = await fetch(`${BASE_URL}/reports/sales-summary`);
    assert(res.status === 401, 'Unauthenticated reports request blocked with HTTP 401');
  } catch (err) {
    assert(false, `Unauth test error: ${err.message}`);
  }

  // 3. Test Sales Summary Report
  try {
    const res = await fetch(`${BASE_URL}/reports/sales-summary`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'GET /api/reports/sales-summary returned HTTP 200');
    assert(typeof data.summary.totalRevenue === 'number', 'Total revenue metric calculated');
    assert(typeof data.summary.totalBills === 'number', 'Total bills count calculated');
    assert(Array.isArray(data.paymentBreakdown), 'Payment breakdown array returned');
    assert(Array.isArray(data.topMedicines), 'Top selling medicines array returned');
    assert(Array.isArray(data.cashierBreakdown), 'Cashier sales performance breakdown returned');
  } catch (err) {
    assert(false, `Sales summary report error: ${err.message}`);
  }

  // 4. Test Invoices Ledger Report
  try {
    const res = await fetch(`${BASE_URL}/reports/invoices`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'GET /api/reports/invoices returned HTTP 200');
    assert(Array.isArray(data.invoices), 'Invoices array returned');
  } catch (err) {
    assert(false, `Invoices report error: ${err.message}`);
  }

  // 5. Test Low-Stock Purchasing Report
  try {
    const res = await fetch(`${BASE_URL}/reports/low-stock`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'GET /api/reports/low-stock returned HTTP 200');
    assert(Array.isArray(data.items) && data.items.length >= 1, `Low-stock report returned >= 1 items (found ${data.items.length})`);
    assert(data.items[0].recommended_reorder_qty !== undefined, 'Recommended reorder quantity calculated for procurement');
  } catch (err) {
    assert(false, `Low-stock report error: ${err.message}`);
  }

  // 6. Test Expiry Audit Report
  try {
    const res = await fetch(`${BASE_URL}/reports/expiry`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'GET /api/reports/expiry returned HTTP 200');
    assert(Array.isArray(data.items) && data.items.length >= 2, `Expiry report returned >= 2 near-expiry/expired batches (found ${data.items.length})`);
    assert(data.items.some(i => i.expiry_status === 'EXPIRED'), 'Expired batches flagged for quarantine & disposal');
    assert(data.items.some(i => i.expiry_status === 'NEAR_EXPIRY'), 'Near-expiry batches flagged for FEFO priority dispensing');
  } catch (err) {
    assert(false, `Expiry report error: ${err.message}`);
  }

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('🎉 ALL REPORTS & ANALYTICS TESTS PASSED!\n');
    setTimeout(() => process.exit(0), 100);
  } else {
    console.error('⚠️ SOME TESTS FAILED!\n');
    setTimeout(() => process.exit(1), 100);
  }
}

runTests();
