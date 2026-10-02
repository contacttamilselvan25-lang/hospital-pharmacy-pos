/**
 * Inventory Management & Stock Adjustment Integration Test Suite
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
  console.log('🧪 Starting Inventory Management Integration Tests...\n');

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
    assert(!!adminToken && !!cashierToken, 'Authenticated Admin and Cashier sessions');
  } catch (err) {
    assert(false, `Authentication failed: ${err.message}`);
  }

  // 2. Test GET /api/inventory
  try {
    const res = await fetch(`${BASE_URL}/inventory`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'GET /api/inventory returned HTTP 200');
    assert(data.inventory && data.inventory.length >= 9, `Inventory returned >= 9 batches (found ${data.inventory.length})`);
  } catch (err) {
    assert(false, `Get inventory error: ${err.message}`);
  }

  // 3. Test Inventory Search
  try {
    const res = await fetch(`${BASE_URL}/inventory?search=Paracetamol`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'Search query returned HTTP 200');
    assert(data.inventory.length >= 1 && data.inventory[0].medicine_name.includes('Paracetamol'), 'Search filtered accurately for "Paracetamol"');
  } catch (err) {
    assert(false, `Search query error: ${err.message}`);
  }

  // 4. Admin Creates New Medicine
  let createdMedicineId = null;
  try {
    const res = await fetch(`${BASE_URL}/inventory/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Ibuprofen 400 mg',
        generic_name: 'Ibuprofen',
        brand_name: 'Brufen',
        strength: '400 mg',
        dosage_form: 'Tablet',
        unit_of_measure: 'strip',
        manufacturer: 'Abbott',
        reorder_level: 60,
        critical_level: 20
      })
    });
    const data = await res.json();
    assert(res.status === 201, 'Admin successfully created new medicine (HTTP 201)');
    createdMedicineId = data.medicine_id;
  } catch (err) {
    assert(false, `Medicine creation error: ${err.message}`);
  }

  // 5. Cashier Blocked From Creating Medicine (403 Forbidden)
  try {
    const res = await fetch(`${BASE_URL}/inventory/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        name: 'Unauthorized Drug',
        generic_name: 'Test',
        strength: '10 mg',
        dosage_form: 'Tablet'
      })
    });
    assert(res.status === 403, 'Cashier blocked from creating medicine with HTTP 403 Forbidden');
  } catch (err) {
    assert(false, `Cashier permission test error: ${err.message}`);
  }

  // 6. Admin Adds New Batch For Medicine
  let createdBatchId = null;
  try {
    const res = await fetch(`${BASE_URL}/inventory/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        medicine_id: createdMedicineId,
        batch_number: 'IBU-990',
        expiry_date: '2028-06-30',
        quantity: 100,
        purchase_price: 2.50,
        selling_price: 5.00
      })
    });
    const data = await res.json();
    assert(res.status === 201, 'Admin added new batch with initial stock (HTTP 201)');
    createdBatchId = data.batch_id;
  } catch (err) {
    assert(false, `Batch creation error: ${err.message}`);
  }

  // 7. Admin Adjusts Stock (+50 units)
  try {
    const res = await fetch(`${BASE_URL}/inventory/stock-adjustment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        batch_id: createdBatchId,
        change_quantity: 50,
        reason: 'New distributor shipment received'
      })
    });
    const data = await res.json();
    assert(res.status === 200, 'Stock adjustment successful (HTTP 200)');
    assert(data.batch.new_quantity === 150, `Quantity updated: 100 -> 150 (found ${data.batch.new_quantity})`);
  } catch (err) {
    assert(false, `Stock adjustment error: ${err.message}`);
  }

  // 8. Reject Negative Stock Adjustment
  try {
    const res = await fetch(`${BASE_URL}/inventory/stock-adjustment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        batch_id: createdBatchId,
        change_quantity: -500, // Excessive deduction
        reason: 'Test negative deduction'
      })
    });
    assert(res.status === 400, 'Negative stock reduction rejected with HTTP 400');
  } catch (err) {
    assert(false, `Negative stock test error: ${err.message}`);
  }

  // 9. Cashier Blocked From Adjusting Stock (403 Forbidden)
  try {
    const res = await fetch(`${BASE_URL}/inventory/stock-adjustment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        batch_id: createdBatchId,
        change_quantity: 10,
        reason: 'Cashier unauthorized modification'
      })
    });
    assert(res.status === 403, 'Cashier blocked from stock adjustments with HTTP 403 Forbidden');
  } catch (err) {
    assert(false, `Cashier stock adjustment block error: ${err.message}`);
  }

  // 10. Check Stock Movement Audit Trail
  try {
    const res = await fetch(`${BASE_URL}/inventory/movements`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'GET /api/inventory/movements returned HTTP 200');
    assert(data.movements && data.movements.length >= 11, `Found ${data.movements.length} total stock movement records in audit trail`);
  } catch (err) {
    assert(false, `Stock movements error: ${err.message}`);
  }

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('🎉 ALL INVENTORY MANAGEMENT TESTS PASSED!\n');
    setTimeout(() => process.exit(0), 100);
  } else {
    console.error('⚠️ SOME TESTS FAILED!\n');
    setTimeout(() => process.exit(1), 100);
  }
}

runTests();
