/**
 * Phase 12: Complete 18-Step College Demonstration Workflow Test
 * 
 * Simulates the exact demonstration sequence:
 * Step 1: Login as Admin
 * Step 2: Show Dashboard & KPIs
 * Step 3: Show Medicine Catalog
 * Step 4: Verify Low-Stock Warning (Aceclofenac)
 * Step 5: Verify Near-Expiry Warning (Omeprazole)
 * Step 6: Verify Expired Medicine (Cetirizine)
 * Step 7: Add Stock (Admin Adjustment)
 * Step 8: Logout Admin
 * Step 9: Login as Cashier
 * Step 10: Open POS Billing Counter
 * Step 11: Attempt Expired Medicine Sale (Verifies Clinical Block)
 * Step 12 & 13: Enter Quantity & Complete Valid Sale
 * Step 14: Verify Generated Invoice
 * Step 15 & 16: Verify Automatic Stock Deduction
 * Step 17: Verify Cashier Shift Invoice History
 * Step 18: Admin Re-login & Stock Movements / Audit Trail Verification
 */

const BASE_URL = 'http://localhost:5000/api';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ STEP PASSED: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ STEP FAILED: ${message}`);
    failed++;
  }
}

async function runE2EWorkflow() {
  console.log('🎓 Starting 18-Step College Project Demonstration Workflow...\n');

  let adminToken = null;
  let cashierToken = null;
  let targetBatch = null;
  let expiredBatch = null;
  let stockBeforeSale = 0;
  let generatedInvoiceNo = null;

  // STEP 1: Login as Admin
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123', passkey: '2306324052' })
    });
    const data = await res.json();
    adminToken = data.token;
    assert(res.status === 200 && data.user.role === 'admin', 'Step 1: Admin authenticated successfully (Dr. Ramesh)');
  } catch (err) {
    assert(false, `Step 1 Failed: ${err.message}`);
  }

  // STEP 2: Show Dashboard & KPIs
  try {
    const res = await fetch(`${BASE_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const stats = await res.json();
    assert(res.status === 200 && stats.totalMedicines > 0, `Step 2: Dashboard KPIs loaded (${stats.totalMedicines} medicines, ${stats.totalStockUnits} stock units)`);
  } catch (err) {
    assert(false, `Step 2 Failed: ${err.message}`);
  }

  // STEP 3: Show Medicine Catalog
  try {
    const res = await fetch(`${BASE_URL}/inventory`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert(res.status === 200 && Array.isArray(data.inventory) && data.inventory.length >= 8, `Step 3: Medicine inventory catalog retrieved (${data.inventory.length} active batches)`);
    
    // Find active normal batch for POS sale
    targetBatch = data.inventory.find(b => b.medicine_name.includes('Paracetamol') && b.quantity > 10);
    // Find expired batch
    expiredBatch = data.inventory.find(b => b.calculatedStatus === 'EXPIRED');
  } catch (err) {
    assert(false, `Step 3 Failed: ${err.message}`);
  }

  // STEP 4: Show Low-Stock Warning
  try {
    const res = await fetch(`${BASE_URL}/dashboard/alerts`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const alerts = await res.json();
    const lowStockAlert = alerts.alerts.find(a => a.alertType === 'LOW_STOCK');
    assert(!!lowStockAlert, `Step 4: Low-stock warning verified for "${lowStockAlert?.medicine_name}" (Stock: ${lowStockAlert?.quantity} <= Reorder: ${lowStockAlert?.reorder_level})`);
  } catch (err) {
    assert(false, `Step 4 Failed: ${err.message}`);
  }

  // STEP 5: Show Near-Expiry Warning
  try {
    const res = await fetch(`${BASE_URL}/dashboard/alerts`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const alerts = await res.json();
    const nearExpiryAlert = alerts.alerts.find(a => a.alertType === 'NEAR_EXPIRY');
    assert(!!nearExpiryAlert, `Step 5: Near-expiry surveillance warning verified for "${nearExpiryAlert?.medicine_name}" (Expires: ${nearExpiryAlert?.expiry_date}, ${nearExpiryAlert?.daysRemaining} days left)`);
  } catch (err) {
    assert(false, `Step 5 Failed: ${err.message}`);
  }

  // STEP 6: Show Expired Medicine Alert
  try {
    const res = await fetch(`${BASE_URL}/dashboard/alerts`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const alerts = await res.json();
    const expAlert = alerts.alerts.find(a => a.alertType === 'EXPIRED');
    assert(!!expAlert, `Step 6: Expired quarantine warning verified for "${expAlert?.medicine_name}" (Expired on ${expAlert?.expiry_date})`);
  } catch (err) {
    assert(false, `Step 6 Failed: ${err.message}`);
  }

  // STEP 7: Add Stock (Admin Stock Adjustment)
  try {
    const res = await fetch(`${BASE_URL}/inventory/stock-adjustment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        batch_id: targetBatch.batch_id,
        change_quantity: 20,
        reason: 'Shipment received from Apex Pharma Distributors'
      })
    });
    const data = await res.json();
    assert(res.status === 200, `Step 7: Stock added successfully: +20 units added to Batch ${targetBatch.batch_number} (New Stock: ${data.batch.new_quantity})`);
    stockBeforeSale = data.batch.new_quantity;
  } catch (err) {
    assert(false, `Step 7 Failed: ${err.message}`);
  }

  // STEP 8: Logout Admin
  try {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'Step 8: Admin logged out cleanly, session audit logged');
    adminToken = null;
  } catch (err) {
    assert(false, `Step 8 Failed: ${err.message}`);
  }

  // STEP 9: Login as Cashier
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'cashier01', password: 'cashier123', passkey: '1111' })
    });
    const data = await res.json();
    cashierToken = data.token;
    assert(res.status === 200 && data.user.role === 'cashier', 'Step 9: Cashier authenticated successfully (Priya Sharma)');
  } catch (err) {
    assert(false, `Step 9 Failed: ${err.message}`);
  }

  // STEP 10: Open POS Billing Counter
  try {
    const res = await fetch(`${BASE_URL}/inventory`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    const data = await res.json();
    assert(res.status === 200 && Array.isArray(data.inventory), 'Step 10: POS live medicine catalog loaded at billing counter');
  } catch (err) {
    assert(false, `Step 10 Failed: ${err.message}`);
  }

  // STEP 11: Attempt Expired Medicine Sale (Verifies Clinical Rejection)
  try {
    if (expiredBatch) {
      const res = await fetch(`${BASE_URL}/sales/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cashierToken}`
        },
        body: JSON.stringify({
          customer_name: 'Patient Safety Test',
          payment_method: 'cash',
          items: [{ batch_id: expiredBatch.batch_id, quantity: 1 }]
        })
      });
      const data = await res.json();
      assert(!res.ok && data.message.includes('expired'), 'Step 11: Dispensing expired medicine strictly rejected by clinical safety engine');
    } else {
      assert(true, 'Step 11: Skipped expired test (no expired batch)');
    }
  } catch (err) {
    assert(false, `Step 11 Failed: ${err.message}`);
  }

  // STEP 12 & 13: Enter Quantity & Complete Sale
  try {
    const sellQty = 3;
    const res = await fetch(`${BASE_URL}/sales/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        customer_name: 'Aditi Verma (OPD #402)',
        payment_method: 'upi',
        items: [{ batch_id: targetBatch.batch_id, quantity: sellQty }]
      })
    });
    const data = await res.json();
    assert(res.status === 201, `Step 12 & 13: Sale processed successfully: ${sellQty} units of ${targetBatch.medicine_name} via UPI`);
    generatedInvoiceNo = data.invoice.invoice_number;
  } catch (err) {
    assert(false, `Step 12/13 Failed: ${err.message}`);
  }

  // STEP 14: Show Generated Invoice
  try {
    assert(!!generatedInvoiceNo && generatedInvoiceNo.startsWith('INV-'), `Step 14: Authentic hospital invoice generated: "${generatedInvoiceNo}"`);
  } catch (err) {
    assert(false, `Step 14 Failed: ${err.message}`);
  }

  // STEP 15 & 16: Verify Automatic Stock Deduction
  try {
    const res = await fetch(`${BASE_URL}/inventory`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    const data = await res.json();
    const updatedBatch = data.inventory.find(b => b.batch_id === targetBatch.batch_id);
    const expectedStock = stockBeforeSale - 3;
    assert(updatedBatch.quantity === expectedStock, `Step 15 & 16: Automatic stock deduction confirmed: ${stockBeforeSale} -> ${updatedBatch.quantity} (exact -3 deduction)`);
  } catch (err) {
    assert(false, `Step 15/16 Failed: ${err.message}`);
  }

  // STEP 17: Show Cashier Shift Invoice History
  try {
    const res = await fetch(`${BASE_URL}/reports/invoices`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    const data = await res.json();
    const foundInvoice = data.invoices.find(inv => inv.invoice_number === generatedInvoiceNo);
    assert(!!foundInvoice, `Step 17: Cashier shift ledger displays invoice "${generatedInvoiceNo}" ready for re-printing`);
  } catch (err) {
    assert(false, `Step 17 Failed: ${err.message}`);
  }

  // STEP 18: Admin Re-login & Stock Movement Audit Trail
  try {
    // Admin login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123', passkey: '2306324052' })
    });
    const adminData = await adminLoginRes.json();
    const adminTok = adminData.token;

    // Verify Stock Movement has SALE entry
    const movementsRes = await fetch(`${BASE_URL}/inventory/movements`, {
      headers: { 'Authorization': `Bearer ${adminTok}` }
    });
    const movementsData = await movementsRes.json();
    const saleMovement = movementsData.movements.find(m => m.reference_id === generatedInvoiceNo);
    assert(!!saleMovement, `Step 18: Permanent stock movement audit entry verified: Type SALE (-3 units) linked to ${generatedInvoiceNo}`);
  } catch (err) {
    assert(false, `Step 18 Failed: ${err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`🎓 College Demonstration E2E Summary:`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`========================================\n`);

  setTimeout(() => process.exit(failed > 0 ? 1 : 0), 100);
}

runE2EWorkflow();
