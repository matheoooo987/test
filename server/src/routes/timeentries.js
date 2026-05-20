const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

router.get('/', (req, res) => {
  const entries = db.prepare(`
    SELECT t.*, c.name as client_name
    FROM time_entries t LEFT JOIN clients c ON t.client_id = c.id
    ORDER BY t.date DESC, t.created_at DESC
  `).all();
  res.json(entries);
});

router.post('/', (req, res) => {
  const { client_id, project, description, duration, hourly_rate, date } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO time_entries (id, client_id, project, description, duration, hourly_rate, date) VALUES (?,?,?,?,?,?,?)')
    .run(id, client_id || null, project, description || '', parseInt(duration) || 0, parseFloat(hourly_rate) || 0, date || new Date().toISOString().split('T')[0]);
  res.json(db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const { client_id, project, description, duration, hourly_rate, date, billed } = req.body;
  db.prepare('UPDATE time_entries SET client_id=?, project=?, description=?, duration=?, hourly_rate=?, date=?, billed=? WHERE id=?')
    .run(client_id || null, project, description || '', parseInt(duration) || 0, parseFloat(hourly_rate) || 0, date, billed ? 1 : 0, req.params.id);
  res.json(db.prepare('SELECT * FROM time_entries WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM time_entries WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Convert selected time entries to invoice
router.post('/to-invoice', (req, res) => {
  const { entry_ids, client_id, hourly_rate } = req.body;
  if (!entry_ids?.length || !client_id) return res.status(400).json({ error: 'Missing params' });

  const entries = entry_ids.map(id => db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id)).filter(Boolean);
  const rate = parseFloat(hourly_rate) || 0;

  const prefix = db.prepare("SELECT value FROM settings WHERE key='invoice_prefix'").get()?.value || 'FAC-';
  const num = db.prepare("SELECT value FROM settings WHERE key='next_invoice_number'").get()?.value || '1';
  db.prepare("UPDATE settings SET value=? WHERE key='next_invoice_number'").run(String(parseInt(num) + 1));
  const invoiceNumber = `${prefix}${String(num).padStart(4, '0')}`;

  const invoiceId = uuidv4();
  const token = uuidv4().replace(/-/g, '').substring(0, 16);
  const taxRate = parseFloat(db.prepare("SELECT value FROM settings WHERE key='default_tax_rate'").get()?.value) || 0;
  const dueDate = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })();

  const items = entries.map(e => ({
    description: `${e.project}${e.description ? ' — ' + e.description : ''} (${(e.duration / 3600).toFixed(2)}h)`,
    quantity: parseFloat((e.duration / 3600).toFixed(2)),
    unit_price: rate || e.hourly_rate,
  }));

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total = subtotal + subtotal * (taxRate / 100);

  db.prepare('INSERT INTO invoices (id, number, client_id, status, issue_date, due_date, tax_rate, total, public_token) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(invoiceId, invoiceNumber, client_id, 'draft', new Date().toISOString().split('T')[0], dueDate, taxRate, total, token);

  const insertItem = db.prepare('INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price) VALUES (?,?,?,?,?)');
  for (const item of items) insertItem.run(uuidv4(), invoiceId, item.description, item.quantity, item.unit_price);

  const markBilled = db.prepare('UPDATE time_entries SET billed=1, invoice_id=? WHERE id=?');
  for (const id of entry_ids) markBilled.run(invoiceId, id);

  res.json({ invoice_id: invoiceId, invoice_number: invoiceNumber });
});

module.exports = router;
