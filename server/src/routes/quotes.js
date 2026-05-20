const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

function getNextQuoteNumber() {
  const prefix = db.prepare("SELECT value FROM settings WHERE key='quote_prefix'").get()?.value || 'DEV-';
  const num = db.prepare("SELECT value FROM settings WHERE key='next_quote_number'").get()?.value || '1';
  db.prepare("UPDATE settings SET value=? WHERE key='next_quote_number'").run(String(parseInt(num) + 1));
  return `${prefix}${String(num).padStart(4, '0')}`;
}

function calcTotal(items, taxRate, discount) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const discounted = subtotal - (subtotal * ((discount || 0) / 100));
  return discounted + discounted * ((taxRate || 0) / 100);
}

router.get('/', (req, res) => {
  const quotes = db.prepare(`
    SELECT q.*, c.name as client_name, c.email as client_email
    FROM quotes q LEFT JOIN clients c ON q.client_id = c.id
    ORDER BY q.created_at DESC
  `).all();
  res.json(quotes);
});

router.get('/:id', (req, res) => {
  const quote = db.prepare(`
    SELECT q.*, c.name as client_name, c.email as client_email,
           c.address as client_address, c.company as client_company
    FROM quotes q LEFT JOIN clients c ON q.client_id = c.id WHERE q.id = ?
  `).get(req.params.id);
  if (!quote) return res.status(404).json({ error: 'Not found' });
  quote.items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(req.params.id);
  res.json(quote);
});

router.post('/', (req, res) => {
  const { client_id, issue_date, valid_until, notes, tax_rate, discount, items, status } = req.body;
  if (!client_id) return res.status(400).json({ error: 'client_id required' });
  const id = uuidv4();
  const number = getNextQuoteNumber();
  const parsedItems = items || [];
  const total = calcTotal(parsedItems, parseFloat(tax_rate) || 0, parseFloat(discount) || 0);

  const validDate = valid_until || (() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0];
  })();

  db.prepare('INSERT INTO quotes (id, number, client_id, status, issue_date, valid_until, notes, tax_rate, discount, total) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, number, client_id, status || 'draft',
      issue_date || new Date().toISOString().split('T')[0], validDate,
      notes || '', parseFloat(tax_rate) || 0, parseFloat(discount) || 0, total);

  const insertItem = db.prepare('INSERT INTO quote_items (id, quote_id, description, quantity, unit_price) VALUES (?,?,?,?,?)');
  for (const item of parsedItems) insertItem.run(uuidv4(), id, item.description, item.quantity, item.unit_price);

  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id);
  quote.items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(id);
  res.json(quote);
});

router.put('/:id', (req, res) => {
  const { client_id, issue_date, valid_until, notes, tax_rate, discount, items, status } = req.body;
  const parsedItems = items || [];
  const total = calcTotal(parsedItems, parseFloat(tax_rate) || 0, parseFloat(discount) || 0);

  db.prepare('UPDATE quotes SET client_id=?, status=?, issue_date=?, valid_until=?, notes=?, tax_rate=?, discount=?, total=? WHERE id=?')
    .run(client_id, status, issue_date, valid_until, notes || '', parseFloat(tax_rate) || 0, parseFloat(discount) || 0, total, req.params.id);

  db.prepare('DELETE FROM quote_items WHERE quote_id = ?').run(req.params.id);
  const insertItem = db.prepare('INSERT INTO quote_items (id, quote_id, description, quantity, unit_price) VALUES (?,?,?,?,?)');
  for (const item of parsedItems) insertItem.run(uuidv4(), req.params.id, item.description, item.quantity, item.unit_price);

  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
  quote.items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(req.params.id);
  res.json(quote);
});

router.patch('/:id/status', (req, res) => {
  db.prepare('UPDATE quotes SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ success: true });
});

// Convert quote to invoice
router.post('/:id/convert', (req, res) => {
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quote not found' });

  const items = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?').all(req.params.id);

  // Get next invoice number
  const prefix = db.prepare("SELECT value FROM settings WHERE key='invoice_prefix'").get()?.value || 'FAC-';
  const num = db.prepare("SELECT value FROM settings WHERE key='next_invoice_number'").get()?.value || '1';
  db.prepare("UPDATE settings SET value=? WHERE key='next_invoice_number'").run(String(parseInt(num) + 1));
  const invoiceNumber = `${prefix}${String(num).padStart(4, '0')}`;

  const invoiceId = uuidv4();
  const token = uuidv4().replace(/-/g, '').substring(0, 16);
  const dueDate = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })();

  db.prepare('INSERT INTO invoices (id, number, client_id, status, issue_date, due_date, notes, tax_rate, discount, total, public_token) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(invoiceId, invoiceNumber, quote.client_id, 'draft',
      new Date().toISOString().split('T')[0], dueDate, quote.notes,
      quote.tax_rate, quote.discount, quote.total, token);

  const insertItem = db.prepare('INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price) VALUES (?,?,?,?,?)');
  for (const item of items) insertItem.run(uuidv4(), invoiceId, item.description, item.quantity, item.unit_price);

  db.prepare('UPDATE quotes SET status=?, converted_to_invoice=? WHERE id=?').run('accepted', invoiceId, req.params.id);

  res.json({ invoice_id: invoiceId, invoice_number: invoiceNumber });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
