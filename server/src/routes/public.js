const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Public invoice view (no auth needed — token-based)
router.get('/invoice/:token', (req, res) => {
  const invoice = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email,
           c.address as client_address, c.company as client_company
    FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.public_token = ?
  `).get(req.params.token);

  if (!invoice) return res.status(404).json({ error: 'Facture introuvable' });

  invoice.items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoice.id);

  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));

  res.json({ invoice, settings });
});

module.exports = router;
