const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const db = require('../db/connection');

const ARCHIVE_DIR = path.join(__dirname, '../../archives/daily_sales');

// Ensure archive directory exists
if (!fs.existsSync(ARCHIVE_DIR)) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}

/**
 * Format currency in Indian Rupees format (or standard ₹ format)
 */
function formatCurrency(num) {
  return '₹' + Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Fetch all completed sales data and item breakdowns for export
 */
function fetchCurrentSalesData() {
  // Overall Summary
  const overall = db.prepare(`
    SELECT 
      COALESCE(SUM(s.total_amount), 0) as total_revenue,
      COUNT(s.id) as total_bills,
      COALESCE(AVG(s.total_amount), 0) as avg_bill_value
    FROM sales s
    WHERE s.status = 'completed'
  `).get();

  // Payment Breakdown
  const paymentBreakdown = db.prepare(`
    SELECT 
      s.payment_method,
      COALESCE(SUM(s.total_amount), 0) as total_amount,
      COUNT(s.id) as count
    FROM sales s
    WHERE s.status = 'completed'
    GROUP BY s.payment_method
  `).all();

  // Invoices List
  const invoices = db.prepare(`
    SELECT 
      s.id,
      s.invoice_number,
      s.created_at,
      s.customer_name,
      s.payment_method,
      s.total_amount,
      u.full_name as cashier_name,
      u.username as cashier_username
    FROM sales s
    JOIN users u ON s.cashier_id = u.id
    WHERE s.status = 'completed'
    ORDER BY s.id ASC
  `).all();

  // Top Medicines Dispensed
  const dispensedMedicines = db.prepare(`
    SELECT 
      m.name as medicine_name,
      m.generic_name,
      m.dosage_form,
      ib.batch_number,
      SUM(si.quantity) as total_quantity,
      si.unit_price,
      SUM(si.total_price) as total_amount
    FROM sale_items si
    JOIN medicines m ON si.medicine_id = m.id
    LEFT JOIN inventory_batches ib ON si.batch_id = ib.id
    JOIN sales s ON si.sale_id = s.id
    WHERE s.status = 'completed'
    GROUP BY m.id, ib.batch_number
    ORDER BY total_quantity DESC
  `).all();

  // Cashier Breakdown
  const cashierBreakdown = db.prepare(`
    SELECT 
      u.username,
      u.full_name as cashier_name,
      COUNT(s.id) as total_bills,
      COALESCE(SUM(s.total_amount), 0) as total_revenue
    FROM sales s
    JOIN users u ON s.cashier_id = u.id
    WHERE s.status = 'completed'
    GROUP BY u.id
  `).all();

  return {
    overall: {
      totalRevenue: Number(overall.total_revenue || 0),
      totalBills: Number(overall.total_bills || 0),
      avgBillValue: Number(overall.avg_bill_value || 0)
    },
    paymentBreakdown,
    invoices,
    dispensedMedicines,
    cashierBreakdown
  };
}

/**
 * Generate Excel Workbook (.xlsx)
 */
async function generateExcelReport(data, targetFilePath, titleDate) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MediFlow Hospital Pharmacy POS';
  workbook.created = new Date();

  // 1. Executive Summary Sheet
  const summarySheet = workbook.addWorksheet('Daily Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 32 },
    { header: 'Value', key: 'value', width: 28 }
  ];

  // Header styling
  summarySheet.mergeCells('A1:B1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = `MEDIFLOW HOSPITAL PHARMACY - DAILY SALES REPORT (${titleDate})`;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 30;

  summarySheet.addRow({});
  summarySheet.addRow({ metric: 'Report Generated At', value: new Date().toLocaleString() });
  summarySheet.addRow({ metric: 'Total Revenue', value: formatCurrency(data.overall.totalRevenue) });
  summarySheet.addRow({ metric: 'Total Invoices / Bills', value: data.overall.totalBills });
  summarySheet.addRow({ metric: 'Average Bill Amount', value: formatCurrency(data.overall.avgBillValue) });

  summarySheet.addRow({});
  const payHeader = summarySheet.addRow({ metric: 'PAYMENT METHOD BREAKDOWN', value: '' });
  payHeader.font = { bold: true };
  data.paymentBreakdown.forEach(p => {
    summarySheet.addRow({ 
      metric: `${p.payment_method.toUpperCase()} (${p.count} bills)`, 
      value: formatCurrency(p.total_amount) 
    });
  });

  summarySheet.addRow({});
  const cashierHeader = summarySheet.addRow({ metric: 'CASHIER PERFORMANCE BREAKDOWN', value: '' });
  cashierHeader.font = { bold: true };
  data.cashierBreakdown.forEach(c => {
    summarySheet.addRow({ 
      metric: `${c.cashier_name} (@${c.username}) - ${c.total_bills} bills`, 
      value: formatCurrency(c.total_revenue) 
    });
  });

  // 2. Invoices Sheet
  const invSheet = workbook.addWorksheet('Invoices & Bills');
  invSheet.columns = [
    { header: 'Invoice #', key: 'invoice_number', width: 22 },
    { header: 'Date & Time', key: 'created_at', width: 22 },
    { header: 'Patient / Customer', key: 'customer_name', width: 24 },
    { header: 'Cashier', key: 'cashier_name', width: 20 },
    { header: 'Payment Method', key: 'payment_method', width: 16 },
    { header: 'Total (INR)', key: 'total_amount', width: 18 }
  ];

  invSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  invSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };

  data.invoices.forEach(inv => {
    invSheet.addRow({
      invoice_number: inv.invoice_number,
      created_at: inv.created_at,
      customer_name: inv.customer_name,
      cashier_name: inv.cashier_name,
      payment_method: inv.payment_method.toUpperCase(),
      total_amount: Number(inv.total_amount)
    });
  });

  // 3. Dispensed Medicines Sheet
  const medSheet = workbook.addWorksheet('Dispensed Medicines');
  medSheet.columns = [
    { header: 'Medicine Name', key: 'medicine_name', width: 28 },
    { header: 'Generic Name', key: 'generic_name', width: 24 },
    { header: 'Dosage Form', key: 'dosage_form', width: 16 },
    { header: 'Batch Number', key: 'batch_number', width: 18 },
    { header: 'Qty Sold', key: 'total_quantity', width: 14 },
    { header: 'Unit Price', key: 'unit_price', width: 14 },
    { header: 'Total Amount', key: 'total_amount', width: 16 }
  ];

  medSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  medSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };

  data.dispensedMedicines.forEach(med => {
    medSheet.addRow({
      medicine_name: med.medicine_name,
      generic_name: med.generic_name || '-',
      dosage_form: med.dosage_form || 'Tablet',
      batch_number: med.batch_number || 'N/A',
      total_quantity: med.total_quantity,
      unit_price: Number(med.unit_price),
      total_amount: Number(med.total_amount)
    });
  });

  await workbook.xlsx.writeFile(targetFilePath);
}

/**
 * Generate Hospital PDF Report (.pdf)
 */
function generatePdfReport(data, targetFilePath, titleDate) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const writeStream = fs.createWriteStream(targetFilePath);

    doc.pipe(writeStream);

    // 1. Hospital Header
    doc.rect(40, 40, 515, 60).fill('#0f172a');
    doc.fillColor('#38bdf8').fontSize(16).text('MEDIFLOW HOSPITAL PHARMACY SYSTEM', 55, 52, { bold: true });
    doc.fillColor('#94a3b8').fontSize(9).text('NABH Certified Inpatient & Outpatient Dispensary Unit', 55, 72);
    doc.fillColor('#f8fafc').fontSize(10).text(`DATE: ${titleDate}`, 430, 56, { align: 'right', width: 110 });
    doc.fillColor('#64748b').fontSize(8).text(`Gen: ${new Date().toLocaleTimeString()}`, 430, 72, { align: 'right', width: 110 });

    doc.moveDown(3);

    // 2. Report Title
    doc.fillColor('#0f172a').fontSize(14).text('DAILY DISPENSARY SALES & AUDIT REPORT', 40, 115, { bold: true });
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, 135).lineTo(555, 135).stroke();

    // 3. Executive Metrics Boxes
    const boxY = 145;
    const boxW = 160;
    const boxH = 50;

    // Box 1: Revenue
    doc.rect(40, boxY, boxW, boxH).fillAndStroke('#f0fdf4', '#86efac');
    doc.fillColor('#166534').fontSize(8).text('TOTAL SALES REVENUE', 50, boxY + 8);
    doc.fillColor('#15803d').fontSize(14).text(formatCurrency(data.overall.totalRevenue), 50, boxY + 22, { bold: true });

    // Box 2: Bills
    doc.rect(215, boxY, boxW, boxH).fillAndStroke('#eff6ff', '#93c5fd');
    doc.fillColor('#1e40af').fontSize(8).text('COMPLETED INVOICES', 225, boxY + 8);
    doc.fillColor('#1d4ed8').fontSize(14).text(`${data.overall.totalBills} Bills`, 225, boxY + 22, { bold: true });

    // Box 3: Avg Bill
    doc.rect(390, boxY, boxW, boxH).fillAndStroke('#fefce8', '#fde047');
    doc.fillColor('#854d0e').fontSize(8).text('AVG INVOICE VALUE', 400, boxY + 8);
    doc.fillColor('#a16207').fontSize(14).text(formatCurrency(data.overall.avgBillValue), 400, boxY + 22, { bold: true });

    // 4. Payment Breakdown Table
    let currentY = 210;
    doc.fillColor('#0f172a').fontSize(11).text('Payment Method Breakdown', 40, currentY, { bold: true });
    currentY += 18;

    doc.rect(40, currentY, 515, 20).fill('#e2e8f0');
    doc.fillColor('#334155').fontSize(9).text('Payment Channel', 50, currentY + 5, { bold: true });
    doc.text('Bill Count', 250, currentY + 5, { bold: true });
    doc.text('Total Amount Collected', 400, currentY + 5, { bold: true });
    currentY += 20;

    if (data.paymentBreakdown.length === 0) {
      doc.fillColor('#64748b').fontSize(8).text('No transactions recorded for this period.', 50, currentY + 6);
      currentY += 18;
    } else {
      data.paymentBreakdown.forEach((p, idx) => {
        if (idx % 2 === 1) doc.rect(40, currentY, 515, 18).fill('#f8fafc');
        doc.fillColor('#0f172a').fontSize(8).text(p.payment_method.toUpperCase(), 50, currentY + 4);
        doc.text(`${p.count} bills`, 250, currentY + 4);
        doc.text(formatCurrency(p.total_amount), 400, currentY + 4);
        currentY += 18;
      });
    }

    currentY += 15;

    // 5. Recent Invoices Summary Table
    doc.fillColor('#0f172a').fontSize(11).text('Completed Dispensary Invoices', 40, currentY, { bold: true });
    currentY += 18;

    doc.rect(40, currentY, 515, 20).fill('#0284c7');
    doc.fillColor('#ffffff').fontSize(8).text('Invoice #', 50, currentY + 5, { bold: true });
    doc.text('Time', 160, currentY + 5, { bold: true });
    doc.text('Patient', 240, currentY + 5, { bold: true });
    doc.text('Cashier', 360, currentY + 5, { bold: true });
    doc.text('Payment', 440, currentY + 5, { bold: true });
    doc.text('Amount', 500, currentY + 5, { bold: true });
    currentY += 20;

    const invoicesToPrint = data.invoices.slice(0, 18); // fit clean on page
    if (invoicesToPrint.length === 0) {
      doc.fillColor('#64748b').fontSize(8).text('No invoice records found.', 50, currentY + 6);
      currentY += 20;
    } else {
      invoicesToPrint.forEach((inv, idx) => {
        if (currentY > 740) {
          doc.addPage();
          currentY = 40;
        }
        if (idx % 2 === 1) doc.rect(40, currentY, 515, 16).fill('#f1f5f9');
        doc.fillColor('#0f172a').fontSize(8).text(inv.invoice_number, 50, currentY + 3);
        const timeStr = inv.created_at ? inv.created_at.split(' ')[1] || inv.created_at : '';
        doc.text(timeStr, 160, currentY + 3);
        doc.text((inv.customer_name || 'Walk-in').substring(0, 18), 240, currentY + 3);
        doc.text((inv.cashier_name || 'Staff').substring(0, 12), 360, currentY + 3);
        doc.text(inv.payment_method.toUpperCase(), 440, currentY + 3);
        doc.text(formatCurrency(inv.total_amount), 495, currentY + 3);
        currentY += 16;
      });
    }

    if (data.invoices.length > 18) {
      doc.fillColor('#64748b').fontSize(8).text(`... and ${data.invoices.length - 18} more invoices (see complete list in the companion Excel file).`, 50, currentY + 6);
      currentY += 20;
    }

    // 6. Sign-off and Verification Footer
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    } else {
      currentY = Math.max(currentY + 25, 710);
    }

    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, currentY).lineTo(555, currentY).stroke();
    currentY += 15;

    doc.fillColor('#64748b').fontSize(8).text('Verified & Audited By: Chief Pharmacist', 50, currentY);
    doc.text('Signature: __________________________', 360, currentY);
    currentY += 15;
    doc.fillColor('#94a3b8').fontSize(7).text('Automated Hospital Pharmacy POS System Security Archive - Confidential Hospital Property', 40, currentY, { align: 'center', width: 515 });

    doc.end();

    writeStream.on('finish', () => resolve(targetFilePath));
    writeStream.on('error', reject);
  });
}

/**
 * Export current sales to both PDF and Excel with a custom prefix or default DAILY_SALES_REPORT
 */
async function exportCurrentSalesDocuments(prefix = 'DAILY_SALES_REPORT') {
  const todayStr = new Date().toISOString().split('T')[0];
  const timestampStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  
  const baseName = prefix === 'DAILY_SALES_REPORT' 
    ? `${prefix}_${todayStr}` 
    : `${prefix}_${todayStr}_${timestampStr}`;

  const excelPath = path.join(ARCHIVE_DIR, `${baseName}.xlsx`);
  const pdfPath = path.join(ARCHIVE_DIR, `${baseName}.pdf`);

  const salesData = fetchCurrentSalesData();

  // Generate Excel
  await generateExcelReport(salesData, excelPath, todayStr);

  // Generate PDF
  await generatePdfReport(salesData, pdfPath, todayStr);

  return {
    baseName,
    todayStr,
    excelFile: `${baseName}.xlsx`,
    pdfFile: `${baseName}.pdf`,
    excelPath,
    pdfPath,
    totalRevenue: salesData.overall.totalRevenue,
    totalBills: salesData.overall.totalBills
  };
}

/**
 * Purge sales history after generating a permanent PDF & Excel backup
 */
async function purgeSalesAndResetHistory(adminUserId) {
  // 1. Generate full Excel and PDF backup first
  const exportResult = await exportCurrentSalesDocuments('SALES_HISTORY_BACKUP');

  // 2. Perform database purge inside transaction
  const purgeSummary = db.transaction(() => {
    // Get count of sales being deleted
    const count = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;

    // Delete sale items
    db.prepare('DELETE FROM sale_items').run();

    // Delete sales
    db.prepare('DELETE FROM sales').run();

    // Log the purge event to audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource, details)
      VALUES (?, 'SALES_HISTORY_PURGED', 'sales', ?)
    `).run(
      adminUserId, 
      `Admin cleared sales history (${count} bills). Auto-saved backup: ${exportResult.excelFile} and ${exportResult.pdfFile}`
    );

    return { purgedBills: count };
  })();

  return {
    ...exportResult,
    purgedBills: purgeSummary.purgedBills
  };
}

/**
 * Get list of all saved PDF and Excel daily archives
 */
function getArchivedReportsList() {
  if (!fs.existsSync(ARCHIVE_DIR)) return [];

  const files = fs.readdirSync(ARCHIVE_DIR);
  return files
    .filter(f => f.endsWith('.pdf') || f.endsWith('.xlsx'))
    .map(filename => {
      const filePath = path.join(ARCHIVE_DIR, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        type: filename.endsWith('.pdf') ? 'pdf' : 'excel',
        sizeBytes: stats.size,
        sizeFormatted: (stats.size / 1024).toFixed(1) + ' KB',
        createdAt: stats.mtime.toISOString(),
        downloadUrl: `/api/reports/download-archive/${filename}`
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  ARCHIVE_DIR,
  exportCurrentSalesDocuments,
  purgeSalesAndResetHistory,
  getArchivedReportsList,
  fetchCurrentSalesData
};
