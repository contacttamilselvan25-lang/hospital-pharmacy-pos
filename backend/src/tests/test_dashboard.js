/**
 * Dashboard & Inventory Alerts Automated Integration Test Suite
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
  console.log('🧪 Starting Dashboard & Stock Alert Engine Tests...\n');

  let adminToken = null;

  // 1. Authenticate as Admin to get JWT token
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123', passkey: '2306324052' })
    });
    const data = await res.json();
    adminToken = data.token;
    assert(!!adminToken, 'Obtained Admin JWT token');
  } catch (err) {
    assert(false, `Login failed: ${err.message}`);
  }

  // 2. Test Unauthenticated Access Rejection
  try {
    const res = await fetch(`${BASE_URL}/dashboard/stats`);
    assert(res.status === 401, 'Unauthenticated stats request rejected with HTTP 401');
  } catch (err) {
    assert(false, `Unauth test error: ${err.message}`);
  }

  // 3. Test Dashboard Stats
  try {
    const res = await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const stats = await res.json();
    assert(res.status === 200, 'GET /api/dashboard/stats returned HTTP 200');
    assert(stats.totalMedicines >= 8, `Total medicines count is >= 8 (found ${stats.totalMedicines})`);
    assert(stats.totalStockUnits > 0, `Total stock units > 0 (found ${stats.totalStockUnits})`);
    assert(stats.criticalStock >= 1, `Critical stock count detected >= 1 (found ${stats.criticalStock})`);
    assert(stats.lowStock >= 1, `Low stock count detected >= 1 (found ${stats.lowStock})`);
    assert(stats.nearExpiry >= 1, `Near expiry count detected >= 1 (found ${stats.nearExpiry})`);
    assert(stats.expired >= 1, `Expired medicines count detected >= 1 (found ${stats.expired})`);
  } catch (err) {
    assert(false, `Stats endpoint error: ${err.message}`);
  }

  // 4. Test Detailed Inventory Alerts
  try {
    const res = await fetch(`${BASE_URL}/dashboard/alerts`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'GET /api/dashboard/alerts returned HTTP 200');
    assert(Array.isArray(data.alerts) && data.alerts.length >= 4, `Alerts array returned with >= 4 items (found ${data.alerts.length})`);

    // Verify Specific Scenarios
    const criticalMed = data.alerts.find(a => a.alertType === 'CRITICAL_STOCK');
    assert(criticalMed && criticalMed.medicine_name.includes('Amoxicillin'), 'Amoxicillin flagged as CRITICAL_STOCK (Stock <= Critical level)');

    const lowStockMed = data.alerts.find(a => a.alertType === 'LOW_STOCK');
    assert(lowStockMed && lowStockMed.medicine_name.includes('Aceclofenac'), 'Aceclofenac flagged as LOW_STOCK (Stock <= Reorder level)');

    const nearExpiryMed = data.alerts.find(a => a.alertType === 'NEAR_EXPIRY');
    assert(nearExpiryMed && nearExpiryMed.medicine_name.includes('Omeprazole'), 'Omeprazole flagged as NEAR_EXPIRY (<90 days remaining)');

    const expiredMed = data.alerts.find(a => a.alertType === 'EXPIRED');
    assert(expiredMed && expiredMed.medicine_name.includes('Cetirizine'), 'Cetirizine flagged as EXPIRED (Past expiry date)');
  } catch (err) {
    assert(false, `Alerts endpoint error: ${err.message}`);
  }

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('🎉 ALL DASHBOARD & ALERT TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.error('⚠️ SOME TESTS FAILED!\n');
    process.exit(1);
  }
}

runTests();
