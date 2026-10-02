/**
 * Hospital Pharmacy POS - Database Schema Definition
 * Relational schema with foreign keys, checks, and audit capabilities.
 */

function initializeSchema(db) {
  // Execute schema creation inside a transaction
  db.transaction(() => {
    // 1. Users Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        passkey TEXT NOT NULL DEFAULT '1111',
        role TEXT NOT NULL CHECK(role IN ('admin', 'cashier')),
        full_name TEXT NOT NULL,
        email TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);

    // 2. Medicines Master Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        generic_name TEXT NOT NULL,
        brand_name TEXT,
        strength TEXT NOT NULL,
        dosage_form TEXT NOT NULL,
        unit_of_measure TEXT NOT NULL DEFAULT 'strip',
        manufacturer TEXT,
        reorder_level INTEGER NOT NULL DEFAULT 50,
        critical_level INTEGER NOT NULL DEFAULT 15,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);

    // 3. Inventory Batches Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS inventory_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
        batch_number TEXT NOT NULL,
        expiry_date TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
        purchase_price REAL NOT NULL DEFAULT 0.0,
        selling_price REAL NOT NULL DEFAULT 0.0,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'quarantined', 'disposed')),
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
        UNIQUE(medicine_id, batch_number)
      );
    `);

    // 4. Sales Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        cashier_id INTEGER NOT NULL REFERENCES users(id),
        subtotal REAL NOT NULL,
        tax_amount REAL NOT NULL DEFAULT 0.0,
        discount_amount REAL NOT NULL DEFAULT 0.0,
        total_amount REAL NOT NULL,
        payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'upi')),
        customer_name TEXT NOT NULL DEFAULT 'Walk-in Patient',
        status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'cancelled')),
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);

    // 5. Sale Items Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        batch_id INTEGER NOT NULL REFERENCES inventory_batches(id),
        medicine_id INTEGER NOT NULL REFERENCES medicines(id),
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);

    // 6. Stock Movements Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL REFERENCES inventory_batches(id),
        movement_type TEXT NOT NULL CHECK(movement_type IN ('STOCK_RECEIVED', 'SALE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'EXPIRED_DISPOSAL')),
        quantity_change INTEGER NOT NULL,
        previous_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        reference_id TEXT,
        reason TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);

    // 7. Audit Logs Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );
    `);

    // Helpful Indexes for Fast POS Searching and Reporting
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
      CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines(generic_name);
      CREATE INDEX IF NOT EXISTS idx_batches_expiry ON inventory_batches(expiry_date);
      CREATE INDEX IF NOT EXISTS idx_batches_medicine ON inventory_batches(medicine_id);
      CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
      CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_batch ON stock_movements(batch_id);
    `);
  })();
}

module.exports = { initializeSchema };
