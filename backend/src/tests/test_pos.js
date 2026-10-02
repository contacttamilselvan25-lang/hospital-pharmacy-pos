/**
 * Cashier POS Billing & Stock Deduction Automated Integration Test Suite
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
  console.log('🧪 Starting POS Billing & Stock Deduction Tests...\n');

  let cashierToken = null;
  let paracetamolBatch = null;
  let expiredBatch = null;

  // 1. Authenticate Cashier
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'cashier01', password: 'cashier123', passkey: '1111' })
    });
    const data = await res.json();
    cashierToken = data.token;
    assert(!!cashierToken, 'Cashier logged in and obtained JWT');
  } catch (err) {
    assert(false, `Cashier login failed: ${err.message}`);
  }

  // 2. Fetch Inventory to Identify Batches
  try {
    const res = await fetch(`${BASE_URL}/inventory`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    const data = await res.json();
    paracetamolBatch = data.inventory.find(b => b.medicine_name.includes('Paracetamol'));
    expiredBatch = data.inventory.find(b => b.calculatedStatus === 'EXPIRED');
    assert(!!paracetamolBatch, 'Identified active Paracetamol batch');
    assert(!!expiredBatch, 'Identified active Expired batch (Cetirizine)');
  } catch (err) {
    assert(false, `Fetch inventory failed: ${err.message}`);
  }

  const initialParacetamolStock = paracetamolBatch.quantity;
  const sellQty = 10;
  let generatedInvoiceNumber = null;

  // 3. Test Successful Checkout & Stock Deduction
  try {
    const res = await fetch(`${BASE_URL}/sales/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        customer_name: 'Anand Kumar (OPD Patient)',
        payment_method: 'upi',
        items: [
          {
            batch_id: paracetamolBatch.batch_id,
            quantity: sellQty
          }
        ]
      })
    });
    const data = await res.json();

    assert(res.status === 201, 'Checkout completed successfully (HTTP 201)');
    assert(!!data.invoice && !!data.invoice.invoice_number, 'Invoice number generated');
    assert(data.invoice.total_amount === Number((sellQty * paracetamolBatch.selling_price).toFixed(2)), 'Invoice total calculation is accurate');
    generatedInvoiceNumber = data.invoice.invoice_number;

    // Verify Stock Was Automatically Deducted
    const invRes = await fetch(`${BASE_URL}/inventory?search=Paracetamol`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    const invData = await invRes.json();
    const updatedBatch = invData.inventory.find(b => b.batch_id === paracetamolBatch.batch_id);
    assert(updatedBatch.quantity === initialParacetamolStock - sellQty, `Stock automatically deducted: ${initialParacetamolStock} - ${sellQty} = ${updatedBatch.quantity}`);
  } catch (err) {
    assert(false, `Checkout failed: ${err.message}`);
  }

  // 4. Test Insufficient Stock Protection
  try {
    const res = await fetch(`${BASE_URL}/sales/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        customer_name: 'Test Patient',
        payment_method: 'cash',
        items: [
          {
            batch_id: paracetamolBatch.batch_id,
            quantity: 99999 // Excessive request
          }
        ]
      })
    });
    const data = await res.json();
    assert(res.status === 400, 'Sale exceeding available stock rejected with HTTP 400');
    assert(data.message.includes('Insufficient stock'), 'Clear error message returned: "Insufficient stock"');
  } catch (err) {
    assert(false, `Insufficient stock test error: ${err.message}`);
  }

  // 5. Test Expired Medicine Blocking
  try {
    const res = await fetch(`${BASE_URL}/sales/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cashierToken}`
      },
      body: JSON.stringify({
        customer_name: 'Test Patient',
        payment_method: 'cash',
        items: [
          {
            batch_id: expiredBatch.batch_id,
            quantity: 1
          }
        ]
      })
    });
    const data = await res.json();
    assert(res.status === 400, 'Sale of expired medicine rejected with HTTP 400');
    assert(data.message.toLowerCase().includes('expired'), 'Dispensing expired medicine blocked with clear clinical message');
  } catch (err) {
    assert(false, `Expired medicine test error: ${err.message}`);
  }

  // 6. Verify Sales History Contains Invoice
  try {
    const res = await fetch(`${BASE_URL}/sales`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    const data = await res.json();
    assert(res.status === 200, 'GET /api/sales returned HTTP 200');
    const recordedSale = data.sales.find(s => s.invoice_number === generatedInvoiceNumber);
    assert(!!recordedSale, `Sales ledger contains generated invoice "${generatedInvoiceNumber}"`);
  } catch (err) {
    assert(false, `Sales history test error: ${err.message}`);
  }

  // 7. Verify Stock Movement History for Counter Sale
  try {
    const res = await fetch(`${BASE_URL}/inventory/movements`, {
      headers: { 'Authorization': `Bearer ${cashierToken}` }
    });
    const data = await res.json();
    const saleMovement = data.movements.find(m => m.reference_id === generatedInvoiceNumber);
    assert(!!saleMovement && saleMovement.movement_type === 'SALE', 'Stock movement recorded with type SALE linked to invoice number');
    assert(saleMovement.quantity_change === -sellQty, `Movement quantity change recorded as -${sellQty}`);
  } catch (err) {
    assert(false, `Stock movements check error: ${err.message}`);
  }

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('🎉 ALL POS BILLING & STOCK DEDUCTION TESTS PASSED!\n');
    setTimeout(() => process.exit(0), 100);
  } else {
    console.error('⚠️ SOME TESTS FAILED!\n');
    setTimeout(() => process.exit(1), 100);
  }
}

runTests();
