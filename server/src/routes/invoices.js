const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

function getNextInvoiceNumber() {
  const prefix = db.prepare("SELECT value FROM settings WHERE key='invoice_prefix'").get()?.value || 'FAC-';
  const num = db.prepare("SELECT value FROM settings WHERE key='next_invoice_number'").get()?.value || '1';
  db.prepare("UPDATE settings SET value=? WHERE key='next_invoice_number'").run(String(parseInt(num) + 1));
  return `${prefix}${String(num).padStart(4, '0')}`;
}

function calcTotal(items, taxRate) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  return subtotal + subtotal * (taxRate / 100);
}

router.get('/', (req, res) => {
  const invoices = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY i.created_at DESC
  `).all();
  res.json(invoices);
});

router.get('/stats', (req, res) => {
  const total = db.prepare("SELECT COALESCE(SUM(total),0) as val FROM invoices WHERE status='paid'").get().val;
  const pending = db.prepare("SELECT COALESCE(SUM(total),0) as val FROM invoices WHERE status='sent'").get().val;
  const count = db.prepare("SELECT COUNT(*) as val FROM invoices").get().val;
  const clients = db.prepare("SELECT COUNT(*) as val FROM clients").get().val;
  res.json({ earned: total, pending, invoiceCount: count, clientCount: clients });
});

router.get('/:id', (req, res) => {
  const invoice = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email, c.address as client_address, c.company as client_company
    FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?
  `).get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  invoice.items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
  res.json(invoice);
});

router.post('/', (req, res) => {
  const { client_id, issue_date, due_date, notes, tax_rate, items, status } = req.body;
  if (!client_id) return res.status(400).json({ error: 'client_id required' });
  const id = uuidv4();
  const number = getNextInvoiceNumber();
  const taxR = parseFloat(tax_rate) || 0;
  const parsedItems = items || [];
  const total = calcTotal(parsedItems, taxR);

  db.prepare('INSERT INTO invoices (id, number, client_id, status, issue_date, due_date, notes, tax_rate, total) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id, number, client_id, status || 'draft', issue_date || new Date().toISOString().split('T')[0],
      due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], notes || '', taxR, total);

  const insertItem = db.prepare('INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price) VALUES (?,?,?,?,?)');
  for (const item of parsedItems) {
    insertItem.run(uuidv4(), id, item.description, item.quantity, item.unit_price);
  }

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  invoice.items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id);
  res.json(invoice);
});

router.put('/:id', (req, res) => {
  const { client_id, issue_date, due_date, notes, tax_rate, items, status } = req.body;
  const taxR = parseFloat(tax_rate) || 0;
  const parsedItems = items || [];
  const total = calcTotal(parsedItems, taxR);

  db.prepare('UPDATE invoices SET client_id=?, status=?, issue_date=?, due_date=?, notes=?, tax_rate=?, total=? WHERE id=?')
    .run(client_id, status, issue_date, due_date, notes || '', taxR, total, req.params.id);

  db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);
  const insertItem = db.prepare('INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price) VALUES (?,?,?,?,?)');
  for (const item of parsedItems) {
    insertItem.run(uuidv4(), req.params.id, item.description, item.quantity, item.unit_price);
  }

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  invoice.items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
  res.json(invoice);
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE invoices SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
