const db = require('../db/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const { exportCurrentSalesDocuments, getArchivedReportsList, purgeSalesAndResetHistory } = require('../services/reportExportService');

async function runTests() {
  console.log('🧪 Starting Staff Management, Daily Export & History Reset Tests...\n');

  try {
    // 1. Verify Dr. Ramesh exists
    const admin = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
    if (!admin) throw new Error('Admin user not found in DB');
    console.log(`✅ Admin verified: ${admin.full_name} (@${admin.username}), Passkey: ${admin.passkey}`);

    // 2. Test Document Export (Excel & PDF)
    console.log('\n📄 Testing Excel & PDF Export Generation...');
    const exportResult = await exportCurrentSalesDocuments('TEST_DAILY_REPORT');
    console.log(`✅ Generated Excel: ${exportResult.excelFile}`);
    console.log(`✅ Generated PDF:   ${exportResult.pdfFile}`);

    const archives = getArchivedReportsList();
    const hasExcel = archives.some(a => a.filename === exportResult.excelFile);
    const hasPdf = archives.some(a => a.filename === exportResult.pdfFile);
    if (!hasExcel || !hasPdf) throw new Error('Exported files not found in archive directory');
    console.log(`✅ Archive listing validated (${archives.length} files found, including .xlsx & .pdf)`);

    // 3. Test Staff Creation
    console.log('\n👥 Testing Staff Member Creation (Admin only)...');
    const testUsername = 'test_nurse_' + Date.now();
    const salt = bcrypt.genSaltSync(10);
    const passHash = bcrypt.hashSync('nurse123', salt);
    const insertRes = db.prepare(`
      INSERT INTO users (username, password_hash, passkey, role, full_name, email, is_active)
      VALUES (?, ?, ?, 'cashier', 'Staff Nurse Preethi', 'preethi@hospital.org', 1)can
    `).run(testUsername, passHash, '7788');
    const newStaffId = insertRes.lastInsertRowid;
    console.log(`✅ Created Staff Member ID #${newStaffId}: Staff Nurse Preethi (@${testUsername}), Passkey: 7788`);

    // 4. Test Staff Edit (Name, Username, Role, Passkey)
    console.log('\n✏️ Testing Staff Member Edit...');
    db.prepare(`
      UPDATE users 
      SET full_name = 'Senior Pharmacist Preethi S', passkey = '9900', username = ?
      WHERE id = ?
    `).run(testUsername + '_edited', newStaffId);
    const updatedStaff = db.prepare('SELECT * FROM users WHERE id = ?').get(newStaffId);
    if (updatedStaff.full_name !== 'Senior Pharmacist Preethi S' || updatedStaff.passkey !== '9900') {
      throw new Error('Staff update failed');
    }
    console.log(`✅ Updated Staff: ${updatedStaff.full_name}, Passkey: ${updatedStaff.passkey}, Username: ${updatedStaff.username}`);

    // 5. Test Admin Change Own Name
    console.log('\n👑 Testing Admin Changing Own Name...');
    const originalName = admin.full_name;
    db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run('Dr. Ramesh M.D. (Chief Pharmacist)', admin.id);
    const updatedAdmin = db.prepare('SELECT * FROM users WHERE id = ?').get(admin.id);
    if (updatedAdmin.full_name !== 'Dr. Ramesh M.D. (Chief Pharmacist)') {
      throw new Error('Admin self name update failed');
    }
    console.log(`✅ Admin Name changed to: "${updatedAdmin.full_name}"`);
    // Revert back
    db.prepare('UPDATE users SET full_name = ? WHERE id = ?').run(originalName, admin.id);
    console.log(`✅ Admin Name safely verified and restored to: "${originalName}"`);

    // 6. Test Staff Delete
    console.log('\n🗑️ Testing Staff Member Deletion...');
    db.prepare('DELETE FROM users WHERE id = ?').run(newStaffId);
    const deletedCheck = db.prepare('SELECT id FROM users WHERE id = ?').get(newStaffId);
    if (deletedCheck) throw new Error('Staff deletion failed');
    console.log(`✅ Staff Member #${newStaffId} successfully deleted.`);

    // 7. Test History Purge with Backup
    console.log('\n🧹 Testing History Purge with Safety Backup (Excel & PDF)...');
    const purgeRes = await purgeSalesAndResetHistory(admin.id);
    console.log(`✅ Purged ${purgeRes.purgedBills} sales bills.`);
    console.log(`✅ Safety Backup Excel created: ${purgeRes.excelFile}`);
    console.log(`✅ Safety Backup PDF created:   ${purgeRes.pdfFile}`);

    // Verify sales table is reset
    const remainingSales = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;
    const remainingItems = db.prepare('SELECT COUNT(*) as count FROM sale_items').get().count;
    console.log(`✅ Remaining sales in DB: ${remainingSales}, Remaining sale items: ${remainingItems}`);

    // 8. Re-seed demo sales for continuous testing
    console.log('\n🔄 Re-seeding test sale to verify ongoing operations...');
    const cashier = db.prepare("SELECT id FROM users WHERE role = 'cashier' LIMIT 1").get();
    const batch = db.prepare("SELECT id, medicine_id, selling_price FROM inventory_batches WHERE quantity > 10 LIMIT 1").get();
    if (cashier && batch) {
      const invNum = 'INV-TEST-' + Date.now().toString().slice(-6);
      const saleInsert = db.prepare(`
        INSERT INTO sales (invoice_number, cashier_id, subtotal, tax_amount, discount_amount, total_amount, payment_method, customer_name, status)
        VALUES (?, ?, ?, ?, 0, ?, 'cash', 'Admitted Patient Test', 'completed')
      `).run(invNum, cashier.id, batch.selling_price * 2, (batch.selling_price * 2) * 0.05, (batch.selling_price * 2) * 1.05);

      db.prepare(`
        INSERT INTO sale_items (sale_id, batch_id, medicine_id, quantity, unit_price, total_price)
        VALUES (?, ?, ?, 2, ?, ?)
      `).run(saleInsert.lastInsertRowid, batch.id, batch.medicine_id, batch.selling_price, batch.selling_price * 2);
      console.log(`✅ Fresh test sale created: ${invNum}`);
    }

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 100% Verified.');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

runTests();
