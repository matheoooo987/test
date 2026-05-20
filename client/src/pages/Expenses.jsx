import { useEffect, useState } from 'react';
import { api } from '../utils/api';

const CATEGORIES = ['Matériel', 'Logiciel', 'Transport', 'Restauration', 'Télécom', 'Formation', 'Marketing', 'Bureautique', 'Autre'];

const catColor = { 'Matériel': 'bg-blue-100 text-blue-700', 'Logiciel': 'bg-purple-100 text-purple-700', 'Transport': 'bg-yellow-100 text-yellow-700', 'Restauration': 'bg-orange-100 text-orange-700', 'Télécom': 'bg-green-100 text-green-700', 'Formation': 'bg-pink-100 text-pink-700', 'Marketing': 'bg-red-100 text-red-700', 'Bureautique': 'bg-gray-100 text-gray-700', 'Autre': 'bg-gray-100 text-gray-600' };

function Modal({ expense, clients, onClose, onSave }) {
  const [form, setForm] = useState(expense || { description: '', amount: '', category: 'Autre', date: new Date().toISOString().split('T')[0], client_id: '', deductible: true, receipt_note: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (expense?.id) await api.updateExpense(expense.id, form);
    else await api.createExpense(form);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-modal-backdrop">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md animate-modal-content">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">{expense?.id ? 'Modifier' : 'Nouvelle dépense'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div><label className="label">Description *</label><input className="input" required value={form.description} onChange={set('description')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Montant *</label><input className="input" required type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} /></div>
            <div><label className="label">Date</label><input className="input" type="date" value={form.date} onChange={set('date')} /></div>
          </div>
          <div><label className="label">Catégorie</label>
            <select className="input" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="label">Client associé</label>
            <select className="input" value={form.client_id} onChange={set('client_id')}>
              <option value="">—</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Note justificatif</label><input className="input" placeholder="N° reçu, note…" value={form.receipt_note} onChange={set('receipt_note')} /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.deductible !== false && form.deductible !== 0} onChange={e => setForm(f => ({ ...f, deductible: e.target.checked }))} className="w-4 h-4 accent-primary-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Déductible fiscalement</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" className="btn-primary flex-1">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ total: 0, deductible: 0, byCategory: [] });
  const [clients, setClients] = useState([]);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [currency, setCurrency] = useState('EUR');

  const load = () => { api.getExpenses().then(setExpenses); api.getExpenseStats().then(setStats); };
  useEffect(() => {
    load(); api.getClients().then(setClients);
    api.getSettings().then(s => s.currency && setCurrency(s.currency)).catch(() => {});
  }, []);

  const del = async (id) => { if (confirm('Supprimer ?')) { await api.deleteExpense(id); load(); } };
  const fmt = (n) => `${parseFloat(n || 0).toFixed(2)} ${currency}`;

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.category === filter);

  return (
    <div className="p-6 max-w-4xl mx-auto animate-page">
      {modal !== false && (
        <Modal expense={modal || undefined} clients={clients} onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />
      )}

      <div className="page-header">
        <div>
          <h2 className="page-title">💸 Dépenses</h2>
          <p className="page-sub">Total : {fmt(stats.total)} · Déductible : {fmt(stats.deductible)}</p>
        </div>
        <button onClick={() => setModal(null)} className="btn-primary">+ Nouvelle dépense</button>
      </div>

      {/* Stats par catégorie */}
      {stats.byCategory?.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
          {stats.byCategory.slice(0, 5).map(c => (
            <div key={c.category} className="card text-center p-4">
              <p className={`badge mx-auto mb-2 ${catColor[c.category] || 'bg-gray-100 text-gray-600'}`}>{c.category}</p>
              <p className="font-bold text-gray-900 dark:text-white text-sm">{fmt(c.total)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtre */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>Toutes</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === c ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{c}</button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">💸</p>
            <p className="text-gray-500 dark:text-gray-400">Aucune dépense enregistrée.</p>
            <button onClick={() => setModal(null)} className="btn-primary mt-4">Ajouter une dépense</button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((e, i) => (
              <div key={e.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 border border-gray-50 dark:border-gray-800/50 animate-list-item" style={{ animationDelay: `${i * 35}ms` }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{e.description}</p>
                    <span className={`badge text-xs ${catColor[e.category] || 'bg-gray-100 text-gray-600'}`}>{e.category}</span>
                    {!e.deductible && <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs">Non déductible</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{e.date}{e.client_name ? ` · ${e.client_name}` : ''}{e.receipt_note ? ` · ${e.receipt_note}` : ''}</p>
                </div>
                <p className="font-bold text-red-500 text-sm">{fmt(e.amount)}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => setModal(e)} className="btn-secondary text-xs py-1">Modifier</button>
                  <button onClick={() => del(e.id)} className="btn text-xs py-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
