import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

function pad(n) { return String(n).padStart(2, '0'); }
function fmtDur(sec) { const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); const s = sec % 60; return `${pad(h)}:${pad(m)}:${pad(s)}`; }

export default function TimeTracker() {
  const [entries, setEntries] = useState([]);
  const [clients, setClients] = useState([]);
  const [currency, setCurrency] = useState('EUR');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timer, setTimer] = useState({ project: '', description: '', client_id: '', hourly_rate: 0 });
  const [form, setForm] = useState({ project: '', description: '', client_id: '', duration: '', hourly_rate: 0, date: new Date().toISOString().split('T')[0] });
  const [selected, setSelected] = useState([]);
  const intervalRef = useRef(null);
  const startRef = useRef(null);
  const navigate = useNavigate();

  const load = () => api.getTimeEntries().then(setEntries);
  useEffect(() => {
    load();
    api.getClients().then(setClients);
    api.getSettings().then(s => s.currency && setCurrency(s.currency)).catch(() => {});
    return () => clearInterval(intervalRef.current);
  }, []);

  const startTimer = () => {
    if (!timer.project) return alert('Renseigne un projet');
    setRunning(true); startRef.current = Date.now();
    intervalRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
  };

  const stopTimer = async () => {
    clearInterval(intervalRef.current); setRunning(false);
    const duration = Math.floor((Date.now() - startRef.current) / 1000);
    setElapsed(0);
    await api.createTimeEntry({ ...timer, duration, date: new Date().toISOString().split('T')[0] });
    load();
  };

  const addManual = async (e) => {
    e.preventDefault();
    const [h, m] = (form.duration || '0:0').split(':').map(Number);
    const secs = (h || 0) * 3600 + (m || 0) * 60;
    await api.createTimeEntry({ ...form, duration: secs });
    setForm({ project: '', description: '', client_id: '', duration: '', hourly_rate: 0, date: new Date().toISOString().split('T')[0] });
    load();
  };

  const del = async (id) => { await api.deleteTimeEntry(id); load(); };
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const toInvoice = async () => {
    if (!selected.length) return alert('Sélectionnez des entrées');
    const firstEntry = entries.find(e => selected.includes(e.id));
    const clientId = firstEntry?.client_id;
    if (!clientId) return alert('Les entrées sélectionnées doivent avoir un client');
    const rate = parseFloat(prompt('Taux horaire (€/h) :', firstEntry?.hourly_rate || '0') || '0');
    try {
      const result = await api.timeToInvoice({ entry_ids: selected, client_id: clientId, hourly_rate: rate });
      alert(`✅ Facture ${result.invoice_number} créée !`);
      setSelected([]);
      navigate(`/invoices/${result.invoice_id}`);
    } catch (e) { alert(e.message); }
  };

  const unbilled = entries.filter(e => !e.billed);
  const totalHours = entries.reduce((s, e) => s + e.duration, 0) / 3600;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h2 className="page-title">⏱️ Suivi du temps</h2>
          <p className="page-sub">{totalHours.toFixed(1)}h enregistrées · {unbilled.length} non facturées</p>
        </div>
        {selected.length > 0 && (
          <button onClick={toInvoice} className="btn-primary">
            🧾 Facturer {selected.length} entrée(s)
          </button>
        )}
      </div>

      {/* Chronomètre */}
      <div className="card mb-6 bg-gradient-to-br from-primary-50 dark:from-primary-900/20 to-blue-50 dark:to-blue-900/20 border-primary-100 dark:border-primary-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">⏱️ Chronomètre</h3>
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="text-5xl font-mono font-bold text-primary-600 dark:text-primary-400 w-40 text-center">
            {fmtDur(elapsed)}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            <input className="input" placeholder="Projet *" value={timer.project} onChange={e => setTimer(t => ({ ...t, project: e.target.value }))} disabled={running} />
            <select className="input" value={timer.client_id} onChange={e => setTimer(t => ({ ...t, client_id: e.target.value }))} disabled={running}>
              <option value="">Client (optionnel)</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input" placeholder="Description" value={timer.description} onChange={e => setTimer(t => ({ ...t, description: e.target.value }))} disabled={running} />
            <input className="input" type="number" placeholder="Taux horaire €/h" value={timer.hourly_rate || ''} onChange={e => setTimer(t => ({ ...t, hourly_rate: parseFloat(e.target.value) || 0 }))} disabled={running} />
          </div>
        </div>
        <div className="flex gap-3">
          {!running ? (
            <button onClick={startTimer} className="btn-primary gap-2">▶ Démarrer</button>
          ) : (
            <button onClick={stopTimer} className="btn-danger gap-2">⏹ Arrêter & Enregistrer</button>
          )}
        </div>
      </div>

      {/* Ajout manuel */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ajouter manuellement</h3>
        <form onSubmit={addManual} className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
          <div><label className="label">Projet *</label><input className="input" required value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} /></div>
          <div><label className="label">Client</label>
            <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
              <option value="">—</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Durée (hh:mm)</label><input className="input" placeholder="1:30" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} /></div>
          <div><label className="label">Taux €/h</label><input className="input" type="number" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: parseFloat(e.target.value) || 0 }))} /></div>
          <div><label className="label">Date</label><input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
          <button type="submit" className="btn-primary h-[38px]">+ Ajouter</button>
        </form>
      </div>

      {/* Liste */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Historique</h3>
          {selected.length > 0 && <span className="text-sm text-primary-600">{selected.length} sélectionnée(s)</span>}
        </div>
        {entries.length === 0 ? (
          <p className="text-center py-8 text-gray-400">Aucune entrée de temps</p>
        ) : (
          <div className="space-y-2">
            {entries.map(e => (
              <div key={e.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                selected.includes(e.id) ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30'
              }`}>
                {!e.billed && (
                  <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)}
                    className="w-4 h-4 accent-primary-600" />
                )}
                {e.billed && <span className="text-green-500 text-lg w-4 text-center">✓</span>}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{e.project}</p>
                  <p className="text-xs text-gray-400">{e.client_name || 'Aucun client'} · {e.date}{e.description ? ` · ${e.description}` : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono font-bold text-gray-900 dark:text-white text-sm">{fmtDur(e.duration)}</p>
                  {e.hourly_rate > 0 && <p className="text-xs text-green-500">{((e.duration / 3600) * e.hourly_rate).toFixed(2)} {currency}</p>}
                </div>
                {e.billed ? <span className="badge bg-green-50 dark:bg-green-900/30 text-green-600 text-xs">Facturé</span>
                  : <span className="badge bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 text-xs">À facturer</span>}
                <button onClick={() => del(e.id)} className="text-red-400 hover:text-red-600 text-sm ml-1">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
