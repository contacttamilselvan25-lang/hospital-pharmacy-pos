const fs = require('fs');
const path = require('path');
const { exportCurrentSalesDocuments } = require('./reportExportService');

const LAST_EXPORT_FILE = path.join(__dirname, '../../archives/daily_sales/.last_daily_export');

function getLastExportDate() {
  try {
    if (fs.existsSync(LAST_EXPORT_FILE)) {
      return fs.readFileSync(LAST_EXPORT_FILE, 'utf8').trim();
    }
  } catch (e) {
    console.error('Error reading last export date:', e);
  }
  return null;
}

function recordExportDate(dateStr) {
  try {
    fs.writeFileSync(LAST_EXPORT_FILE, dateStr, 'utf8');
  } catch (e) {
    console.error('Error writing last export date:', e);
  }
}

/**
 * Perform daily check and auto-save PDF and Excel reports
 */
async function checkAndRunDailyArchive() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastExportDate = getLastExportDate();

    // If today hasn't been archived yet
    if (lastExportDate !== todayStr) {
      console.log(`[DailyScheduler] Generating automated daily PDF & Excel reports for ${todayStr}...`);
      const result = await exportCurrentSalesDocuments('DAILY_SALES_REPORT');
      recordExportDate(todayStr);
      console.log(`[DailyScheduler] Successfully generated ${result.excelFile} and ${result.pdfFile} (${result.totalBills} bills, revenue: ₹${result.totalRevenue})`);
      return result;
    }
  } catch (err) {
    console.error('[DailyScheduler] Error during automatic daily report export:', err);
  }
  return null;
}

/**
 * Start background timer to check for daily export every 30 minutes
 */
function initDailyScheduler() {
  // Check immediately on startup
  checkAndRunDailyArchive();

  // Check every 30 minutes
  setInterval(() => {
    checkAndRunDailyArchive();
  }, 30 * 60 * 1000);
}

module.exports = {
  checkAndRunDailyArchive,
  initDailyScheduler
};
