const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db/connection');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { 
  ARCHIVE_DIR, 
  exportCurrentSalesDocuments, 
  purgeSalesAndResetHistory, 
  getArchivedReportsList 
} = require('../services/reportExportService');

const router = express.Router();

/**
 * GET /api/reports/sales-summary
 * Computes sales aggregates, revenue by payment method, daily breakdown,
 * and top-selling medicines. Restricted to Admin.
 */
router.get('/sales-summary', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
      dateFilter = ` AND DATE(s.created_at) BETWEEN DATE(?) AND DATE(?)`;
      params.push(start_date, end_date);
    }

    // 1. Overall Aggregates
    const overall = db.prepare(`
      SELECT 
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COUNT(s.id) as total_bills,
        COALESCE(AVG(s.total_amount), 0) as avg_bill_value
      FROM sales s
      WHERE s.status = 'completed' ${dateFilter}
    `).get(...params);

    // 2. Revenue Breakdown by Payment Method
    const paymentBreakdown = db.prepare(`
      SELECT 
        s.payment_method,
        COALESCE(SUM(s.total_amount), 0) as total_amount,
        COUNT(s.id) as count
      FROM sales s
      WHERE s.status = 'completed' ${dateFilter}
      GROUP BY s.payment_method
    `).all(...params);

    // 3. Top-Selling Medicines
    const topMedicines = db.prepare(`
      SELECT 
        m.name as medicine_name,
        m.generic_name,
        m.strength,
        SUM(si.quantity) as total_quantity_sold,
        SUM(si.total_price) as total_revenue_generated
      FROM sale_items si
      JOIN medicines m ON si.medicine_id = m.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'completed' ${dateFilter}
      GROUP BY m.id
      ORDER BY total_quantity_sold DESC
      LIMIT 10
    `).all(...params);

    // 4. Sales by Cashier Breakdown
    const cashierBreakdown = db.prepare(`
      SELECT 
        u.username,
        u.full_name as cashier_name,
        COUNT(s.id) as total_bills,
        COALESCE(SUM(s.total_amount), 0) as total_revenue
      FROM sales s
      JOIN users u ON s.cashier_id = u.id
      WHERE s.status = 'completed' ${dateFilter}
      GROUP BY u.id
    `).all(...params);

    res.json({
      summary: {
        totalRevenue: Number(overall.total_revenue.toFixed(2)),
        totalBills: overall.total_bills,
        averageBillValue: Number(overall.avg_bill_value.toFixed(2))
      },
      paymentBreakdown,
      topMedicines,
      cashierBreakdown
    });
  } catch (error) {
    console.error('Error fetching sales summary report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/invoices
 * Detailed invoice list with cashier and customer information.
 */
router.get('/invoices', authenticateToken, (req, res) => {
  try {
    let query = `
      SELECT 
        s.id as sale_id,
        s.invoice_number,
        s.created_at,
        s.customer_name,
        s.payment_method,
        s.total_amount,
        u.username as cashier_username,
        u.full_name as cashier_name,
        (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
      FROM sales s
      JOIN users u ON s.cashier_id = u.id
    `;
    const params = [];

    // Security Scoping: Cashiers only see their own invoices, Admins see all invoices
    if (req.user.role === 'cashier') {
      query += ` WHERE s.cashier_id = ?`;
      params.push(req.user.id);
    }

    query += ` ORDER BY s.id DESC LIMIT 100`;

    const invoices = db.prepare(query).all(...params);

    res.json({
      total: invoices.length,
      invoices
    });
  } catch (error) {
    console.error('Error fetching invoice report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/low-stock
 * Dedicated report on low-stock and critical-stock medicines for purchasing audits. Restricted to Admin.
 */
router.get('/low-stock', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const items = db.prepare(`
      SELECT 
        b.id as batch_id,
        m.id as medicine_id,
        m.name as medicine_name,
        m.generic_name,
        m.strength,
        m.dosage_form,
        m.manufacturer,
        b.batch_number,
        b.expiry_date,
        b.quantity as current_stock,
        m.reorder_level,
        m.critical_level,
        (m.reorder_level * 2 - b.quantity) as recommended_reorder_qty,
        CASE 
          WHEN b.quantity <= m.critical_level THEN 'CRITICAL'
          ELSE 'LOW'
        END as stock_status
      FROM inventory_batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.status = 'active' AND b.quantity <= m.reorder_level
      ORDER BY b.quantity ASC
    `).all();

    res.json({
      total: items.length,
      items
    });
  } catch (error) {
    console.error('Error fetching low-stock report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/expiry
 * Expiry audit report prioritizing soon-to-expire (FEFO) and already expired medicines. Restricted to Admin.
 */
router.get('/expiry', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const todayDate = new Date();

    const items = db.prepare(`
      SELECT 
        b.id as batch_id,
        m.name as medicine_name,
        m.generic_name,
        m.strength,
        m.dosage_form,
        m.manufacturer,
        b.batch_number,
        b.expiry_date,
        b.quantity as current_stock,
        b.purchase_price,
        (b.quantity * b.purchase_price) as total_inventory_cost,
        CASE 
          WHEN b.expiry_date <= ? THEN 'EXPIRED'
          ELSE 'NEAR_EXPIRY'
        END as expiry_status
      FROM inventory_batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.status = 'active' AND b.expiry_date <= ?
      ORDER BY b.expiry_date ASC
    `).all(today, in90Days);

    const enriched = items.map(item => {
      const expDate = new Date(item.expiry_date);
      const diffTime = expDate - todayDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...item,
        daysDifference: diffDays,
        actionRequired: item.expiry_status === 'EXPIRED' 
          ? 'Quarantine & Dispose (Prohibited from sale)' 
          : 'Dispense first (FEFO Priority)'
      };
    });

    res.json({
      total: enriched.length,
      items: enriched
    });
  } catch (error) {
    console.error('Error fetching expiry report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/archives
 * Admin only: Returns list of all generated PDF and Excel archive reports.
 */
router.get('/archives', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const archives = getArchivedReportsList();
    res.json({ archives });
  } catch (error) {
    console.error('Error fetching archives list:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/download-archive/:filename
 * Admin only: Downloads a specific archived PDF or Excel file.
 */
router.get('/download-archive/:filename', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const { filename } = req.params;
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(ARCHIVE_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archive file not found' });
    }

    res.download(filePath, safeFilename);
  } catch (error) {
    console.error('Error downloading archive:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports/auto-save-daily
 * Admin only: Manually trigger generation and saving of daily PDF and Excel reports.
 */
router.post('/auto-save-daily', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await exportCurrentSalesDocuments('DAILY_SALES_REPORT');
    res.json({
      message: `Daily report generated and saved successfully: ${result.excelFile} & ${result.pdfFile}`,
      result
    });
  } catch (error) {
    console.error('Error auto-saving daily report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/reports/clear-history
 * Admin only: Purges sales & invoice history after automatically exporting PDF & Excel backup.
 * Requires Admin Security Passkey confirmation.
 */
router.post('/clear-history', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { passkey } = req.body;

    if (!passkey || !String(passkey).trim()) {
      return res.status(400).json({
        error: 'Passkey required',
        message: 'Chief Pharmacist security passkey is required to clear sales history.'
      });
    }

    // Verify admin passkey against database
    const adminUser = db.prepare('SELECT id, passkey FROM users WHERE id = ?').get(req.user.id);
    if (!adminUser || adminUser.passkey.trim() !== String(passkey).trim()) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid security passkey. Access denied to clear history.'
      });
    }

    // Generate PDF and Excel backup first, then purge
    const result = await purgeSalesAndResetHistory(req.user.id);

    res.json({
      message: `Sales and report history cleared successfully. Emergency backup saved: ${result.excelFile} & ${result.pdfFile}`,
      purgedBills: result.purgedBills,
      excelFile: result.excelFile,
      pdfFile: result.pdfFile
    });
  } catch (error) {
    console.error('Error clearing sales history:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
