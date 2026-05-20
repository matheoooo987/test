const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../db/database');

function getSettings() {
  const rows = db.prepare('SELECT * FROM settings').all();
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

router.post('/invoice/:id', async (req, res) => {
  const s = getSettings();
  if (!s.smtp_host || !s.smtp_user) {
    return res.status(400).json({ error: 'Email SMTP non configuré. Va dans les paramètres.' });
  }

  const invoice = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email
    FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = ?
  `).get(req.params.id);

  if (!invoice) return res.status(404).json({ error: 'Facture introuvable' });
  if (!invoice.client_email) return res.status(400).json({ error: 'Le client n\'a pas d\'email' });

  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
  const currency = s.currency || 'EUR';
  const fmt = (n) => `${parseFloat(n || 0).toFixed(2)} ${currency}`;

  const itemsHtml = items.map(i =>
    `<tr><td style="padding:8px;border-bottom:1px solid #f0f0f0">${i.description}</td>
     <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td>
     <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right">${fmt(i.unit_price)}</td>
     <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:bold">${fmt(i.quantity * i.unit_price)}</td></tr>`
  ).join('');

  const publicLink = invoice.public_token
    ? `<p style="margin-top:20px;text-align:center">
        <a href="${req.headers.origin || 'http://localhost:3000'}/public/invoice/${invoice.public_token}"
           style="background:#0284c7;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Voir la facture en ligne
        </a>
       </p>` : '';

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <div style="background:#0284c7;padding:32px;color:white">
      <h1 style="margin:0;font-size:24px">${s.business_name}</h1>
      <p style="margin:8px 0 0;opacity:.8">Facture ${invoice.number}</p>
    </div>
    <div style="padding:32px">
      <p>Bonjour ${invoice.client_name},</p>
      <p>Veuillez trouver ci-joint votre facture <strong>${invoice.number}</strong> d'un montant de <strong>${fmt(invoice.total)}</strong>, à régler avant le <strong>${invoice.due_date}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead><tr style="background:#f8fafc">
          <th style="padding:10px 8px;text-align:left">Description</th>
          <th style="padding:10px 8px;text-align:center">Qté</th>
          <th style="padding:10px 8px;text-align:right">Prix unit.</th>
          <th style="padding:10px 8px;text-align:right">Total</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="text-align:right;padding:16px;background:#f8fafc;border-radius:8px">
        <p style="margin:4px 0;color:#666">Sous-total : ${fmt((invoice.items || items).reduce ? items.reduce((s,i) => s + i.quantity * i.unit_price, 0) : 0)}</p>
        <p style="margin:4px 0;color:#666">TVA (${invoice.tax_rate || 0}%) : ${fmt(items.reduce((s,i) => s + i.quantity * i.unit_price, 0) * ((invoice.tax_rate || 0) / 100))}</p>
        <p style="margin:8px 0 0;font-size:18px;font-weight:bold;color:#0284c7">Total : ${fmt(invoice.total)}</p>
      </div>
      ${publicLink}
      ${invoice.notes ? `<p style="margin-top:20px;padding:16px;background:#fffbeb;border-radius:8px;color:#92400e"><em>${invoice.notes}</em></p>` : ''}
      <hr style="border:none;border-top:1px solid #f0f0f0;margin:24px 0">
      <p style="color:#999;font-size:12px;text-align:center">
        ${s.business_name} · ${s.business_email} · ${s.business_phone}<br>
        ${s.business_address}
      </p>
    </div>
  </div>`;

  try {
    const transporter = nodemailer.createTransport({
      host: s.smtp_host,
      port: parseInt(s.smtp_port) || 587,
      secure: parseInt(s.smtp_port) === 465,
      auth: { user: s.smtp_user, pass: s.smtp_pass },
    });

    await transporter.sendMail({
      from: `"${s.business_name}" <${s.smtp_from || s.smtp_user}>`,
      to: req.body.to || invoice.client_email,
      subject: req.body.subject || `Facture ${invoice.number} — ${s.business_name}`,
      html,
    });

    db.prepare('UPDATE invoices SET status=? WHERE id=? AND status=?').run('sent', req.params.id, 'draft');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur envoi email : ' + err.message });
  }
});

module.exports = router;
