import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';

const emptyItem = { description: '', quantity: 1, unit_price: 0 };

export default function QuoteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';
  const [form, setForm] = useState({
    client_id: '', issue_date: new Date().toISOString().split('T')[0],
    valid_until: '', notes: '', tax_rate: 20, discount: 0, status: 'draft', items: []
  });
  const [clients, setClients] = useState([]);
  const [currency, setCurrency] = useState('EUR');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getClients().then(setClients);
    api.getSettings().then(s => {
      s.currency && setCurrency(s.currency);
      if (!isEdit) setForm(f => ({ ...f, tax_rate: parseFloat(s.default_tax_rate) || 20 }));
    }).catch(() => {});
    if (isEdit) {
      api.getQuote(id).then(q => setForm({
        client_id: q.client_id, issue_date: q.issue_date, valid_until: q.valid_until,
        notes: q.notes || '', tax_rate: q.tax_rate, discount: q.discount || 0,
        status: q.status, items: q.items || []
      }));
    } else {
      const d = new Date(); d.setDate(d.getDate() + 30);
      setForm(f => ({ ...f, valid_until: d.toISOString().split('T')[0] }));
    }
  }, [id]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setItem = (i, k) => (e) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [k]: k === 'description' ? e.target.value : parseFloat(e.target.value) || 0 };
    return { ...f, items };
  });
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const subtotal = form.items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0);
  const discounted = subtotal - subtotal * ((parseFloat(form.discount) || 0) / 100);
  const taxAmt = discounted * ((parseFloat(form.tax_rate) || 0) / 100);
  const total = discounted + taxAmt;
  const fmt = (n) => `${n.toFixed(2)} ${currency}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_id) return alert('Sélectionnez un client');
    if (!form.items.length) return alert('Ajoutez au moins une ligne');
    setSaving(true);
    try {
      if (isEdit) await api.updateQuote(id, form);
      else await api.createQuote(form);
      navigate('/quotes');
    } catch (err) { alert(err.message); }
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto animate-page">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-gray-600 mb-2 flex items-center gap-1">← Retour</button>
        <h2 className="page-title">{isEdit ? 'Modifier le devis' : 'Nouveau devis'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Informations</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Client *</label>
              <select className="input" value={form.client_id} onChange={set('client_id')} required>
                <option value="">— Choisir un client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </div>
            <div><label className="label">Date d'émission</label><input className="input" type="date" value={form.issue_date} onChange={set('issue_date')} /></div>
            <div><label className="label">Valide jusqu'au</label><input className="input" type="date" value={form.valid_until} onChange={set('valid_until')} /></div>
            <div><label className="label">Remise (%)</label><input className="input" type="number" min="0" max="100" value={form.discount} onChange={set('discount')} /></div>
            <div><label className="label">TVA (%)</label><input className="input" type="number" min="0" max="100" value={form.tax_rate} onChange={set('tax_rate')} /></div>
            <div className="col-span-2"><label className="label">Statut</label>
              <select className="input" value={form.status} onChange={set('status')}>
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyé</option>
                <option value="accepted">Accepté</option>
                <option value="refused">Refusé</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Lignes</h3>
            <button type="button" onClick={addItem} className="btn-secondary text-xs">+ Ajouter</button>
          </div>
          {form.items.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <p className="text-gray-400 text-sm mb-2">Ajoutez vos prestations</p>
              <button type="button" onClick={addItem} className="btn-primary text-sm">+ Ajouter une ligne</button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium px-1">
                <span className="col-span-6">Description</span><span className="col-span-2 text-center">Qté</span>
                <span className="col-span-3 text-right">Prix unit.</span><span></span>
              </div>
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input className="input col-span-6 text-sm" placeholder="Prestation…" value={item.description} onChange={setItem(i, 'description')} />
                  <input className="input col-span-2 text-center text-sm" type="number" min="0" step="0.01" value={item.quantity} onChange={setItem(i, 'quantity')} />
                  <input className="input col-span-3 text-right text-sm" type="number" min="0" step="0.01" value={item.unit_price} onChange={setItem(i, 'unit_price')} />
                  <button type="button" onClick={() => removeItem(i)} className="col-span-1 text-red-400 hover:text-red-600 text-center text-lg">×</button>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
                {form.discount > 0 && <div className="flex justify-between text-red-500"><span>Remise ({form.discount}%)</span><span>-{fmt(subtotal * ((parseFloat(form.discount) || 0) / 100))}</span></div>}
                <div className="flex justify-between text-gray-500"><span>TVA ({form.tax_rate}%)</span><span>{fmt(taxAmt)}</span></div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100 dark:border-gray-800 text-primary-600"><span>Total</span><span>{fmt(total)}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <label className="label">Notes / Conditions</label>
          <textarea className="input resize-none" rows={3} value={form.notes} onChange={set('notes')} placeholder="Conditions de validité, modalités…" />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Annuler</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? '⏳ Enregistrement…' : isEdit ? '💾 Sauvegarder' : '✅ Créer le devis'}
          </button>
        </div>
      </form>
    </div>
  );
}
