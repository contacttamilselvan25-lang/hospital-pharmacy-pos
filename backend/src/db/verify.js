/**
 * Database Verification Script
 * Validates tables, constraints, foreign keys, and seed data integrity.
 */

const bcrypt = require('bcryptjs');
const db = require('./connection');

console.log('🧪 Starting Database Integrity & Seed Verification...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// 1. Check Tables Exist
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name;
`).all().map(r => r.name);

const expectedTables = [
  'audit_logs',
  'inventory_batches',
  'medicines',
  'sale_items',
  'sales',
  'stock_movements',
  'users'
];

expectedTables.forEach(t => {
  assert(tables.includes(t), `Table "${t}" exists in schema`);
});

// 2. Verify Users & Password Hashing
const users = db.prepare('SELECT * FROM users').all();
assert(users.length === 3, `Expected 3 users, found ${users.length}`);

const admin = users.find(u => u.username === 'admin');
assert(admin && admin.role === 'admin', 'Admin user exists with role "admin"');
assert(bcrypt.compareSync('admin123', admin.password_hash), 'Admin password hash verified with bcrypt');

const cashier = users.find(u => u.username === 'cashier01');
assert(cashier && cashier.role === 'cashier', 'Cashier user exists with role "cashier"');
assert(bcrypt.compareSync('cashier123', cashier.password_hash), 'Cashier password hash verified with bcrypt');

// 3. Verify Medicines & Batches
const medicines = db.prepare('SELECT * FROM medicines').all();
assert(medicines.length === 8, `Expected 8 demo medicines, found ${medicines.length}`);

const batches = db.prepare(`
  SELECT b.*, m.name as medicine_name, m.reorder_level, m.critical_level
  FROM inventory_batches b
  JOIN medicines m ON b.medicine_id = m.id
`).all();
assert(batches.length === 9, `Expected 9 demo batches, found ${batches.length}`);

// 4. Verify Stock Alert Test Scenarios in Demo Data
const lowStock = batches.filter(b => b.quantity <= b.reorder_level && b.quantity > b.critical_level);
assert(lowStock.length >= 1, `Found ${lowStock.length} Low-Stock test scenario (Aceclofenac)`);

const criticalStock = batches.filter(b => b.quantity <= b.critical_level);
assert(criticalStock.length >= 1, `Found ${criticalStock.length} Critical-Stock test scenario (Amoxicillin)`);

const todayStr = new Date().toISOString().split('T')[0];
const expiredStock = batches.filter(b => b.expiry_date < todayStr);
assert(expiredStock.length >= 1, `Found ${expiredStock.length} Expired batch test scenario (Cetirizine CET-EXP)`);

// 5. Verify Check Constraint: Prevent Negative Inventory
try {
  db.prepare(`
    INSERT INTO inventory_batches (medicine_id, batch_number, expiry_date, quantity, purchase_price, selling_price)
    VALUES (?, 'TEST-NEG', '2028-01-01', -5, 10, 15)
  `).run(medicines[0].id);
  assert(false, 'Database allowed negative inventory (CHECK constraint missing!)');
} catch (err) {
  assert(true, 'Database successfully rejected negative inventory via CHECK constraint');
}

// 6. Verify Stock Movement and Audit Trail
const movements = db.prepare('SELECT * FROM stock_movements').all();
assert(movements.length === 9, `Stock movements recorded for all 9 initial batches (${movements.length} found)`);

const audits = db.prepare('SELECT * FROM audit_logs').all();
assert(audits.length >= 2, `Audit trail logs exist (${audits.length} found)`);

console.log('\n----------------------------------------');
console.log(`Results: ${passCount} Passed, ${failCount} Failed`);
if (failCount === 0) {
  console.log('🎉 ALL DATABASE TESTS PASSED!\n');
  process.exit(0);
} else {
  console.error('⚠️ SOME TESTS FAILED!\n');
  process.exit(1);
}
