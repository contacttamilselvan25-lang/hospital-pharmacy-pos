const express = require('express');
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/dashboard/stats
 * Aggregates high-level pharmacy KPIs: total medicines, total stock units,
 * today's sales & bill count, and counts for all 4 alert tiers.
 */
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. Total Medicines (Active)
    const medCount = db.prepare(`
      SELECT COUNT(*) as count FROM medicines WHERE is_active = 1
    `).get().count;

    // 2. Total Stock Units in Active Batches
    const stockUnits = db.prepare(`
      SELECT COALESCE(SUM(quantity), 0) as total FROM inventory_batches WHERE status = 'active'
    `).get().total;

    // 3. Today's Sales & Bill Count
    const todaySalesData = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as bill_count
      FROM sales 
      WHERE DATE(created_at) = DATE(?) AND status = 'completed'
    `).get(today);

    // 4. Critical Stock Count (quantity <= critical_level)
    const criticalCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM inventory_batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.status = 'active' AND b.quantity <= m.critical_level
    `).get().count;

    // 5. Low Stock Count (quantity <= reorder_level AND quantity > critical_level)
    const lowCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM inventory_batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.status = 'active' 
        AND b.quantity <= m.reorder_level 
        AND b.quantity > m.critical_level
    `).get().count;

    // 6. Near Expiry Count (> today AND <= in90Days)
    const nearExpiryCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM inventory_batches
      WHERE status = 'active' 
        AND expiry_date > ? 
        AND expiry_date <= ?
    `).get(today, in90Days).count;

    // 7. Expired Count (<= today)
    const expiredCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM inventory_batches
      WHERE status = 'active' AND expiry_date <= ?
    `).get(today).count;

    res.json({
      totalMedicines: medCount,
      totalStockUnits: stockUnits,
      todayRevenue: todaySalesData.total_revenue,
      todayBills: todaySalesData.bill_count,
      criticalStock: criticalCount,
      lowStock: lowCount,
      nearExpiry: nearExpiryCount,
      expired: expiredCount,
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/dashboard/alerts
 * Returns full list of actionable inventory alerts classified by alert type.
 */
router.get('/alerts', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayDate = new Date();
    const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const rawBatches = db.prepare(`
      SELECT 
        b.id as batch_id,
        b.medicine_id,
        m.name as medicine_name,
        m.generic_name,
        m.strength,
        m.dosage_form,
        b.batch_number,
        b.expiry_date,
        b.quantity,
        m.reorder_level,
        m.critical_level,
        b.selling_price
      FROM inventory_batches b
      JOIN medicines m ON b.medicine_id = m.id
      WHERE b.status = 'active'
      ORDER BY b.expiry_date ASC, b.quantity ASC
    `).all();

    const alerts = [];

    rawBatches.forEach(batch => {
      const expDate = new Date(batch.expiry_date);
      const diffTime = expDate - todayDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 1. Expired Alert
      if (batch.expiry_date <= today) {
        alerts.push({
          ...batch,
          alertType: 'EXPIRED',
          severity: 'critical',
          color: '#ef4444',
          badgeText: 'EXPIRED',
          message: `Batch expired ${Math.abs(diffDays)} day(s) ago. Sale is prohibited!`,
          daysRemaining: diffDays,
          recommendation: 'Remove from shelf immediately and mark for disposal.'
        });
      } 
      // 2. Near Expiry Alert (< 90 Days)
      else if (batch.expiry_date <= in90Days) {
        alerts.push({
          ...batch,
          alertType: 'NEAR_EXPIRY',
          severity: 'warning',
          color: '#f97316',
          badgeText: 'NEAR EXPIRY',
          message: `Expires in ${diffDays} day(s) (${batch.expiry_date})`,
          daysRemaining: diffDays,
          recommendation: 'Dispense with priority (FEFO) before expiration.'
        });
      }

      // 3. Critical Stock Alert (<= critical_level)
      if (batch.quantity <= batch.critical_level) {
        alerts.push({
          ...batch,
          alertType: 'CRITICAL_STOCK',
          severity: 'critical',
          color: '#dc2626',
          badgeText: 'CRITICAL STOCK',
          message: `Critical stock: Only ${batch.quantity} units left (Threshold: ${batch.critical_level})`,
          recommendation: 'Place emergency order with distributor immediately.'
        });
      } 
      // 4. Low Stock Alert (<= reorder_level AND > critical_level)
      else if (batch.quantity <= batch.reorder_level) {
        alerts.push({
          ...batch,
          alertType: 'LOW_STOCK',
          severity: 'warning',
          color: '#f59e0b',
          badgeText: 'LOW STOCK',
          message: `Stock level ${batch.quantity} is at or below reorder level (${batch.reorder_level})`,
          recommendation: 'Schedule purchase order for upcoming supplier cycle.'
        });
      }
    });

    res.json({
      totalAlerts: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
