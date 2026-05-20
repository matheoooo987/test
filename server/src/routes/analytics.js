const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  // Monthly revenue (last 12 months)
  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', issue_date) as month,
           SUM(CASE WHEN status='paid' THEN total ELSE 0 END) as earned,
           SUM(CASE WHEN status='sent' THEN total ELSE 0 END) as pending,
           COUNT(*) as count
    FROM invoices
    WHERE issue_date >= date('now', '-12 months')
    GROUP BY month ORDER BY month ASC
  `).all();

  // Top clients by revenue
  const topClients = db.prepare(`
    SELECT c.name, c.id,
           SUM(CASE WHEN i.status='paid' THEN i.total ELSE 0 END) as earned,
           COUNT(i.id) as invoice_count
    FROM clients c
    LEFT JOIN invoices i ON i.client_id = c.id
    GROUP BY c.id
    ORDER BY earned DESC
    LIMIT 5
  `).all();

  // Invoice status distribution
  const statusDist = db.prepare(`
    SELECT status, COUNT(*) as count, COALESCE(SUM(total),0) as total
    FROM invoices GROUP BY status
  `).all();

  // Billable hours this month
  const hoursThisMonth = db.prepare(`
    SELECT COALESCE(SUM(duration),0) as seconds
    FROM time_entries
    WHERE date >= date('now', 'start of month')
  `).get().seconds;

  // Total expenses this year
  const expensesYear = db.prepare(`
    SELECT COALESCE(SUM(amount),0) as total FROM expenses
    WHERE date >= date('now', 'start of year')
  `).get().total;

  // Quote conversion rate
  const quotesTotal = db.prepare('SELECT COUNT(*) as c FROM quotes').get().c;
  const quotesConverted = db.prepare("SELECT COUNT(*) as c FROM quotes WHERE status='accepted'").get().c;

  // Average invoice value
  const avgInvoice = db.prepare("SELECT AVG(total) as avg FROM invoices WHERE status='paid'").get().avg;

  // Overdue invoices
  const overdue = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total),0) as total
    FROM invoices WHERE status='sent' AND due_date < date('now')
  `).get();

  res.json({
    monthly,
    topClients,
    statusDist,
    hoursThisMonth: Math.round(hoursThisMonth / 3600 * 10) / 10,
    expensesYear,
    quoteConversionRate: quotesTotal > 0 ? Math.round((quotesConverted / quotesTotal) * 100) : 0,
    avgInvoiceValue: avgInvoice ? Math.round(avgInvoice * 100) / 100 : 0,
    overdue,
  });
});

module.exports = router;
