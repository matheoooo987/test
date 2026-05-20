const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

router.get('/', (req, res) => {
  const expenses = db.prepare(`
    SELECT e.*, c.name as client_name
    FROM expenses e LEFT JOIN clients c ON e.client_id = c.id
    ORDER BY e.date DESC
  `).all();
  res.json(expenses);
});

router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COALESCE(SUM(amount),0) as val FROM expenses').get().val;
  const deductible = db.prepare('SELECT COALESCE(SUM(amount),0) as val FROM expenses WHERE deductible=1').get().val;
  const byCategory = db.prepare('SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC').all();
  res.json({ total, deductible, byCategory });
});

router.post('/', (req, res) => {
  const { description, amount, category, date, client_id, deductible, receipt_note } = req.body;
  if (!description || !amount) return res.status(400).json({ error: 'description and amount required' });
  const id = uuidv4();
  db.prepare('INSERT INTO expenses (id, description, amount, category, date, client_id, deductible, receipt_note) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, description, parseFloat(amount), category || 'Autre', date || new Date().toISOString().split('T')[0],
      client_id || null, deductible !== false ? 1 : 0, receipt_note || '');
  res.json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const { description, amount, category, date, client_id, deductible, receipt_note } = req.body;
  db.prepare('UPDATE expenses SET description=?, amount=?, category=?, date=?, client_id=?, deductible=?, receipt_note=? WHERE id=?')
    .run(description, parseFloat(amount), category, date, client_id || null, deductible ? 1 : 0, receipt_note || '', req.params.id);
  res.json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
