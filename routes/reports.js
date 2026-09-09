const express = require('express');
const db = require('../database');

const router = express.Router();

// GET /api/reports/daily - Daily sales summary
router.get('/daily', (req, res) => {
  const { date } = req.query;
  const reportDate = date || new Date().toISOString().split('T')[0];

  db.all(
    `SELECT
      COUNT(DISTINCT i.id) as total_invoices,
      SUM(i.total_amount) as total_sales,
      SUM(ii.quantity) as total_quantity_sold,
      COUNT(DISTINCT ii.medicine_id) as unique_medicines,
      SUM(ii.quantity * (ii.unit_price - (
        SELECT cost_price FROM medicines WHERE id = ii.medicine_id
      ))) as total_profit
     FROM invoices i
     LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
     WHERE DATE(i.created_at) = ?`,
    [reportDate],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const report = result[0] || {
        total_invoices: 0,
        total_sales: 0,
        total_quantity_sold: 0,
        unique_medicines: 0,
        total_profit: 0
      };

      report.date = reportDate;
      report.profit_margin = report.total_sales ? ((report.total_profit / report.total_sales) * 100).toFixed(2) + '%' : '0%';

      res.json(report);
    }
  );
});

// GET /api/reports/monthly - Monthly profit/loss
router.get('/monthly', (req, res) => {
  const { month } = req.query;
  const reportMonth = month || new Date().toISOString().substring(0, 7); // YYYY-MM

  db.all(
    `SELECT
      strftime('%Y-%m-%d', i.created_at) as date,
      COUNT(DISTINCT i.id) as invoices,
      SUM(i.total_amount) as sales,
      SUM(ii.quantity * (ii.unit_price - (
        SELECT cost_price FROM medicines WHERE id = ii.medicine_id
      ))) as profit
     FROM invoices i
     LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
     WHERE strftime('%Y-%m', i.created_at) = ?
     GROUP BY date
     ORDER BY date ASC`,
    [reportMonth],
    (err, daily_data) => {
      if (err) return res.status(500).json({ error: err.message });

      const totals = daily_data.reduce((acc, day) => ({
        total_sales: acc.total_sales + (day.sales || 0),
        total_profit: acc.total_profit + (day.profit || 0),
        total_invoices: acc.total_invoices + (day.invoices || 0)
      }), { total_sales: 0, total_profit: 0, total_invoices: 0 });

      totals.month = reportMonth;
      totals.profit_margin = totals.total_sales ? ((totals.total_profit / totals.total_sales) * 100).toFixed(2) + '%' : '0%';
      totals.daily_breakdown = daily_data;

      res.json(totals);
    }
  );
});

// GET /api/reports/top-medicines - Top selling medicines
router.get('/top-medicines', (req, res) => {
  const { limit } = req.query;
  const topLimit = limit || 10;

  db.all(
    `SELECT
      m.id, m.name, m.sku,
      SUM(ii.quantity) as quantity_sold,
      SUM(ii.subtotal) as revenue,
      SUM(ii.quantity * (ii.unit_price - m.cost_price)) as profit
     FROM invoice_items ii
     JOIN medicines m ON ii.medicine_id = m.id
     GROUP BY m.id
     ORDER BY quantity_sold DESC
     LIMIT ?`,
    [topLimit],
    (err, medicines) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(medicines);
    }
  );
});

// GET /api/reports/expired-medicines - Expired stock
router.get('/expired-medicines', (req, res) => {
  db.all(
    `SELECT id, name, sku, quantity, expiry_date, cost_price, selling_price
     FROM medicines
     WHERE expiry_date < DATE('now')
     ORDER BY expiry_date ASC`,
    (err, medicines) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(medicines);
    }
  );
});

// GET /api/reports/dashboard - Dashboard summary
router.get('/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  db.all(
    `SELECT
      (SELECT SUM(total_amount) FROM invoices WHERE DATE(created_at) = ?) as today_sales,
      (SELECT SUM(tax_amount) FROM invoices WHERE DATE(created_at) = ?) as today_tax,
      (SELECT COUNT(*) FROM invoices WHERE DATE(created_at) = ?) as today_invoices,
      (SELECT COUNT(*) FROM medicines WHERE expiry_date < DATE('now')) as expired_count,
      (SELECT COUNT(*) FROM medicines WHERE quantity < 10) as low_stock_count,
      (SELECT COUNT(DISTINCT phone) FROM customers) as total_customers
    `,
    [today, today, today],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const data = result[0] || {};
      res.json({
        today_sales: data.today_sales || 0,
        today_tax: data.today_tax || 0,
        today_invoices: data.today_invoices || 0,
        expired_count: data.expired_count || 0,
        low_stock_count: data.low_stock_count || 0,
        total_customers: data.total_customers || 0
      });
    }
  );
});

// GET /api/reports/fbr-tax - FBR Tax Compliance Report
router.get('/fbr-tax', (req, res) => {
  const { start_date, end_date } = req.query;

  let query = `
    SELECT
      DATE(created_at) as date,
      COUNT(*) as invoices,
      SUM(total_amount) as total_sales,
      SUM(discount_amount) as total_discount,
      SUM(tax_amount) as total_tax,
      AVG(tax_percent) as avg_tax_rate
    FROM invoices
    WHERE fbr_compliant = 1
  `;

  const params = [];

  if (start_date && end_date) {
    query += ` AND DATE(created_at) BETWEEN ? AND ?`;
    params.push(start_date, end_date);
  }

  query += ` GROUP BY DATE(created_at) ORDER BY date DESC`;

  db.all(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    // Calculate totals
    const totals = results.reduce((acc, row) => ({
      total_invoices: acc.total_invoices + row.invoices,
      total_sales: acc.total_sales + row.total_sales,
      total_discount: acc.total_discount + row.total_discount,
      total_tax: acc.total_tax + row.total_tax
    }), { total_invoices: 0, total_sales: 0, total_discount: 0, total_tax: 0 });

    // Calculate effective tax rate
    totals.effective_tax_rate = totals.total_sales ?
      ((totals.total_tax / totals.total_sales) * 100).toFixed(2) + '%' : '0%';

    res.json({
      period: { start_date, end_date },
      daily_breakdown: results,
      summary: totals,
      fbr_status: 'COMPLIANT'
    });
  });
});

// GET /api/reports/monthly-tax - Monthly tax liability
router.get('/monthly-tax', (req, res) => {
  const { month } = req.query;
  const reportMonth = month || new Date().toISOString().substring(0, 7);

  db.all(
    `SELECT
      strftime('%Y-%m-%d', created_at) as date,
      COUNT(*) as invoices,
      SUM(total_amount) as sales,
      SUM(tax_amount) as tax_liability,
      SUM(discount_amount) as total_discounts
    FROM invoices
    WHERE strftime('%Y-%m', created_at) = ? AND fbr_compliant = 1
    GROUP BY date
    ORDER BY date ASC`,
    [reportMonth],
    (err, daily_data) => {
      if (err) return res.status(500).json({ error: err.message });

      const totals = daily_data.reduce((acc, day) => ({
        total_invoices: acc.total_invoices + day.invoices,
        total_sales: acc.total_sales + day.sales,
        total_tax_liability: acc.total_tax_liability + day.tax_liability,
        total_discounts: acc.total_discounts + day.total_discounts
      }), { total_invoices: 0, total_sales: 0, total_tax_liability: 0, total_discounts: 0 });

      res.json({
        month: reportMonth,
        daily_breakdown: daily_data,
        summary: {
          ...totals,
          effective_tax_rate: totals.total_sales ?
            ((totals.total_tax_liability / totals.total_sales) * 100).toFixed(2) + '%' : '0%',
          tax_to_deposit: totals.total_tax_liability,
          fbr_instructions: 'File return via FBR portal. Tax liable to deposit in bank account.',
          due_date: `${reportMonth}-25` // Monthly filing due by 25th
        }
      });
    }
  );
});

module.exports = router;
