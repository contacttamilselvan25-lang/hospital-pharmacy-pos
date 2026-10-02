/**
 * Hospital Pharmacy POS - Database Seed Script
 * Populates realistic college demo data with diverse stock conditions:
 * Normal, Low Stock, Critical Stock, Near Expiry (<90 days), and Expired.
 */

const bcrypt = require('bcryptjs');
const db = require('./connection');
const { initializeSchema } = require('./schema');

function seedDatabase() {
  console.log('🌱 Starting Hospital Pharmacy Database Seeding...');

  // Ensure clean tables
  db.transaction(() => {
    // Disable FK temporarily for table cleanup
    db.pragma('foreign_keys = OFF');
    db.exec(`
      DROP TABLE IF EXISTS audit_logs;
      DROP TABLE IF EXISTS stock_movements;
      DROP TABLE IF EXISTS sale_items;
      DROP TABLE IF EXISTS sales;
      DROP TABLE IF EXISTS inventory_batches;
      DROP TABLE IF EXISTS medicines;
      DROP TABLE IF EXISTS users;
    `);
    db.pragma('foreign_keys = ON');

    // Create fresh tables
    initializeSchema(db);
    console.log('✅ Tables initialized successfully.');

    // 1. Seed Users (Hashed Passwords)
    const saltRounds = 10;
    const adminPasswordHash = bcrypt.hashSync('admin123', saltRounds);
    const cashierPasswordHash = bcrypt.hashSync('cashier123', saltRounds);

    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, passkey, role, full_name, email, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const adminUser = insertUser.run('admin', adminPasswordHash, '2306324052', 'admin', 'Dr. Ramesh (Chief Pharmacist)', 'admin@hospital.org');
    const cashier1 = insertUser.run('cashier01', cashierPasswordHash, '1111', 'cashier', 'Priya Sharma (Counter A)', 'priya@hospital.org');
    const cashier2 = insertUser.run('cashier02', cashierPasswordHash, '2222', 'cashier', 'Karthik Raj (Counter B)', 'karthik@hospital.org');

    console.log('✅ Seeded 3 Staff Users (1 Admin with passkey 2306324052, 2 Cashiers)');

    // 2. Seed Medicines Master Data
    const insertMedicine = db.prepare(`
      INSERT INTO medicines (name, generic_name, brand_name, strength, dosage_form, unit_of_measure, manufacturer, reorder_level, critical_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const medParacetamol = insertMedicine.run('Paracetamol 500 mg', 'Acetaminophen', 'Calpol / Crocin', '500 mg', 'Tablet', 'strip', 'GSK Pharma', 50, 15);
    const medAceclofenac = insertMedicine.run('Aceclofenac 100 mg', 'Aceclofenac', 'Hifenac', '100 mg', 'Tablet', 'strip', 'Intas Pharma', 50, 15);
    const medAmoxicillin = insertMedicine.run('Amoxicillin 500 mg', 'Amoxicillin Trihydrate', 'Mox 500', '500 mg', 'Capsule', 'strip', 'Sun Pharma', 50, 15);
    const medOmeprazole = insertMedicine.run('Omeprazole 20 mg', 'Omeprazole', 'Omez 20', '20 mg', 'Capsule', 'strip', 'Dr. Reddy\'s', 40, 15);
    const medCetirizine = insertMedicine.run('Cetirizine 10 mg', 'Cetirizine Dihydrochloride', 'Cetzine', '10 mg', 'Tablet', 'strip', 'Alkem Labs', 30, 10);
    const medPantoprazole = insertMedicine.run('Pantoprazole 40 mg', 'Pantoprazole Sodium', 'Pan 40', '40 mg', 'Tablet', 'strip', 'Alkem Labs', 40, 15);
    const medAzithromycin = insertMedicine.run('Azithromycin 500 mg', 'Azithromycin', 'Azee 500', '500 mg', 'Tablet', 'strip', 'Cipla', 30, 10);
    const medCoughSyrup = insertMedicine.run('Ascoril D Plus', 'Dextromethorphan + Chlorpheniramine', 'Ascoril D', '100 ml', 'Syrup', 'bottle', 'Glenmark', 20, 5);

    console.log('✅ Seeded 8 Master Medicines');

    // 3. Seed Batches with deliberate alert test scenarios:
    // Today's Date calculation for Near-Expiry and Expired
    const today = new Date();
    
    // Near Expiry Date (+40 days from today)
    const nearExpiryDate = new Date(today.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Past Expiry Date (-90 days ago)
    const expiredDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const insertBatch = db.prepare(`
      INSERT INTO inventory_batches (medicine_id, batch_number, expiry_date, quantity, purchase_price, selling_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertStockMovement = db.prepare(`
      INSERT INTO stock_movements (batch_id, movement_type, quantity_change, previous_quantity, new_quantity, reference_id, reason, user_id)
      VALUES (?, 'STOCK_RECEIVED', ?, 0, ?, 'INITIAL-RECEIVE', 'Initial Stock Setup', ?)
    `);

    // Helper to insert batch and record its initial stock movement
    const addBatchWithMovement = (medId, batchNum, expiry, qty, purchase, selling, status = 'active') => {
      const res = insertBatch.run(medId, batchNum, expiry, qty, purchase, selling, status);
      insertStockMovement.run(res.lastInsertRowid, qty, qty, adminUser.lastInsertRowid);
      return res.lastInsertRowid;
    };

    // 1. Normal Stock: Paracetamol (450 units, expires 2027)
    addBatchWithMovement(medParacetamol.lastInsertRowid, 'PCM-2026-A', '2027-12-31', 450, 1.20, 2.50);

    // 2. Low Stock Warning: Aceclofenac (35 units remaining, reorder level is 50)
    addBatchWithMovement(medAceclofenac.lastInsertRowid, 'ACE-004', '2027-08-30', 35, 3.00, 6.00);

    // 3. Critical Stock Alert: Amoxicillin (8 units remaining, critical level is 15)
    addBatchWithMovement(medAmoxicillin.lastInsertRowid, 'AMX-801', '2027-10-15', 8, 5.50, 9.50);

    // 4. Near Expiry Warning: Omeprazole (expires in ~40 days)
    addBatchWithMovement(medOmeprazole.lastInsertRowid, 'OME-102', nearExpiryDate, 120, 2.80, 5.00);

    // 5. Expired Batch Alert: Cetirizine (expired ~90 days ago, must be blocked from sale!)
    addBatchWithMovement(medCetirizine.lastInsertRowid, 'CET-EXP', expiredDate, 40, 1.50, 3.50);

    // 6. Multiple Batches for One Medicine: Pantoprazole
    addBatchWithMovement(medPantoprazole.lastInsertRowid, 'PAN-BATCH-1', '2028-02-15', 300, 4.00, 7.50);
    addBatchWithMovement(medPantoprazole.lastInsertRowid, 'PAN-BATCH-2', '2027-05-20', 150, 4.00, 7.50);

    // 7. Normal Stock: Azithromycin
    addBatchWithMovement(medAzithromycin.lastInsertRowid, 'AZI-505', '2027-11-20', 85, 12.00, 22.00);

    // 8. Normal Stock: Cough Syrup
    addBatchWithMovement(medCoughSyrup.lastInsertRowid, 'ASC-901', '2027-09-10', 45, 65.00, 95.00);

    console.log('✅ Seeded 9 Inventory Batches with initial stock movements');

    // 4. Seed Audit Logs
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource, details)
      VALUES (?, ?, ?, ?)
    `);

    insertAudit.run(adminUser.lastInsertRowid, 'SYSTEM_INIT', 'database', 'Initial database schema and demo catalog populated');
    insertAudit.run(adminUser.lastInsertRowid, 'USER_CREATED', 'users', 'Created cashier accounts cashier01 and cashier02');

    console.log('✅ Seeded Audit Logs');
  })();

  console.log('🎉 Database seeding completed successfully!\n');
}

// Run seeder if script is invoked directly
if (require.main === module) {
  try {
    seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

module.exports = { seedDatabase };
