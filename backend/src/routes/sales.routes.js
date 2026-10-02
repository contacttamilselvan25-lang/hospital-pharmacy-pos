const express = require('express');
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/sales/checkout
 * Processes a POS sale:
 * 1. Validates items in cart
 * 2. Strict Check: Blocks expired medicines
 * 3. Strict Check: Blocks sale if insufficient stock
 * 4. Transactionally creates sale & sale_items
 * 5. Deducts inventory stock
 * 6. Records stock movements and audit log
 * 7. Returns full printable invoice object
 */
router.post('/checkout', authenticateToken, (req, res) => {
  try {
    const { customer_name, payment_method, items } = req.body;

    // 1. Basic Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Cart is empty. Please add at least one medicine to checkout.'
      });
    }

    const validPayments = ['cash', 'card', 'upi'];
    const payment = (payment_method || 'cash').toLowerCase();
    if (!validPayments.includes(payment)) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid payment method. Allowed: cash, card, upi.'
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let createdSale = null;

    // Execute entire checkout within an ACID Database Transaction
    db.transaction(() => {
      let subtotal = 0;
      const verifiedItems = [];

      // 2. Validate every cart item against real-time database state
      for (const item of items) {
        const batchId = parseInt(item.batch_id, 10);
        const rawQty = Number(item.quantity);

        if (!batchId || isNaN(batchId) || isNaN(rawQty) || !Number.isInteger(rawQty) || rawQty <= 0) {
          throw new Error('Invalid cart item or quantity specified. Quantity must be a positive whole integer.');
        }

        const requestedQty = rawQty;

        const batch = db.prepare(`
          SELECT 
            b.*,
            m.name as medicine_name,
            m.generic_name,
            m.strength,
            m.dosage_form
          FROM inventory_batches b
          JOIN medicines m ON b.medicine_id = m.id
          WHERE b.id = ?
        `).get(batchId);

        if (!batch) {
          throw new Error(`Batch ID #${batchId} was not found in database.`);
        }

        // Check if medicine batch has expired
        if (batch.expiry_date <= todayStr) {
          throw new Error(
            `Cannot sell this medicine because the selected batch (${batch.batch_number} - ${batch.medicine_name}) expired on ${batch.expiry_date}. Dispensing expired medicine is strictly prohibited.`
          );
        }

        // Check for sufficient physical stock
        if (requestedQty > batch.quantity) {
          throw new Error(
            `Insufficient stock for "${batch.medicine_name}". Only ${batch.quantity} units are available, but ${requestedQty} were requested.`
          );
        }

        const unitPrice = batch.selling_price;
        const lineTotal = Number((requestedQty * unitPrice).toFixed(2));
        subtotal += lineTotal;

        verifiedItems.push({
          batch_id: batch.id,
          medicine_id: batch.medicine_id,
          medicine_name: batch.medicine_name,
          generic_name: batch.generic_name,
          strength: batch.strength,
          dosage_form: batch.dosage_form,
          batch_number: batch.batch_number,
          expiry_date: batch.expiry_date,
          current_stock: batch.quantity,
          quantity: requestedQty,
          unit_price: unitPrice,
          line_total: lineTotal
        });
      }

      subtotal = Number(subtotal.toFixed(2));
      const totalAmount = subtotal; // For college demo: tax is 0 or inclusive

      // Generate guaranteed unique invoice number: INV-YYYYMMDD-XXXX
      const datePart = todayStr.replace(/-/g, '');
      let invoiceNumber = '';
      let isUnique = false;
      const checkInvoice = db.prepare('SELECT id FROM sales WHERE invoice_number = ?');
      while (!isUnique) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        invoiceNumber = `INV-${datePart}-${randomSuffix}`;
        const existing = checkInvoice.get(invoiceNumber);
        if (!existing) {
          isUnique = true;
        }
      }

      // 3. Insert Sale Header
      const insertSale = db.prepare(`
        INSERT INTO sales (
          invoice_number, cashier_id, subtotal, tax_amount, discount_amount,
          total_amount, payment_method, customer_name, status
        ) VALUES (?, ?, ?, 0.0, 0.0, ?, ?, ?, 'completed')
      `);

      const safeCustomerName = (customer_name && typeof customer_name === 'string')
        ? customer_name.trim().substring(0, 100)
        : 'Walk-in Patient';

      const saleResult = insertSale.run(
        invoiceNumber,
        req.user.id,
        subtotal,
        totalAmount,
        payment,
        safeCustomerName
      );

      const saleId = saleResult.lastInsertRowid;

      const insertSaleItem = db.prepare(`
        INSERT INTO sale_items (sale_id, batch_id, medicine_id, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const deductStock = db.prepare(`
        UPDATE inventory_batches 
        SET quantity = quantity - ?, updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `);

      const insertMovement = db.prepare(`
        INSERT INTO stock_movements (
          batch_id, movement_type, quantity_change, previous_quantity,
          new_quantity, reference_id, reason, user_id
        ) VALUES (?, 'SALE', ?, ?, ?, ?, 'Counter Patient Billing', ?)
      `);

      // 4. Process each line item: record sale item, deduct stock, create movement
      for (const item of verifiedItems) {
        insertSaleItem.run(
          saleId,
          item.batch_id,
          item.medicine_id,
          item.quantity,
          item.unit_price,
          item.line_total
        );

        const newStock = item.current_stock - item.quantity;

        // Deduct inventory
        deductStock.run(item.quantity, item.batch_id);

        // Record stock movement
        insertMovement.run(
          item.batch_id,
          -item.quantity,
          item.current_stock,
          newStock,
          invoiceNumber,
          req.user.id
        );
      }

      // 5. Record in Audit Log
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
        VALUES (?, 'SALE_COMPLETED', 'sales', ?, ?)
      `).run(
        req.user.id,
        String(saleId),
        `Completed invoice ${invoiceNumber} for ${customer_name || 'Walk-in Patient'}, Total: ₹${totalAmount}, Items: ${verifiedItems.length}`
      );

      // Prepare invoice payload for client
      createdSale = {
        sale_id: saleId,
        invoice_number: invoiceNumber,
        date_time: new Date().toLocaleString(),
        cashier_name: req.user.full_name || req.user.username,
        cashier_username: req.user.username,
        customer_name: customer_name ? customer_name.trim() : 'Walk-in Patient',
        payment_method: payment.toUpperCase(),
        subtotal,
        total_amount: totalAmount,
        items: verifiedItems
      };
    })();

    res.status(201).json({
      message: 'Sale completed and stock deducted successfully',
      invoice: createdSale
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(400).json({
      error: 'Checkout failed',
      message: error.message
    });
  }
});

/**
 * GET /api/sales
 * Lists historical sales for audit and billing records.
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const sales = db.prepare(`
      SELECT 
        s.id,
        s.invoice_number,
        s.customer_name,
        s.subtotal,
        s.total_amount,
        s.payment_method,
        s.status,
        s.created_at,
        u.username as cashier_username,
        u.full_name as cashier_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
      FROM sales s
      JOIN users u ON s.cashier_id = u.id
      ORDER BY s.id DESC
      LIMIT 100
    `).all();

    res.json({
      total: sales.length,
      sales
    });
  } catch (error) {
    console.error('Error fetching sales history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sales/:id
 * Fetches an itemized receipt for reprint or inspection.
 */
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const sale = db.prepare(`
      SELECT 
        s.*,
        u.username as cashier_username,
        u.full_name as cashier_name
      FROM sales s
      JOIN users u ON s.cashier_id = u.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!sale) {
      return res.status(404).json({ error: 'Sale record not found' });
    }

    const items = db.prepare(`
      SELECT 
        si.*,
        m.name as medicine_name,
        m.generic_name,
        m.strength,
        m.dosage_form,
        b.batch_number,
        b.expiry_date
      FROM sale_items si
      JOIN medicines m ON si.medicine_id = m.id
      JOIN inventory_batches b ON si.batch_id = b.id
      WHERE si.sale_id = ?
    `).all(req.params.id);

    res.json({
      sale,
      items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
