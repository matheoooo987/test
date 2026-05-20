import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const statusStyle = {
  draft: 'badge bg-gray-100 text-gray-600',
  sent: 'badge bg-yellow-50 text-yellow-600',
  paid: 'badge bg-green-50 text-green-600',
  cancelled: 'badge bg-red-50 text-red-500',
};
const statusLabel = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', cancelled: 'Annulée' };

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter] = useState('all');
  const [currency, setCurrency] = useState('EUR');

  const load = () => api.getInvoices().then(setInvoices);
  useEffect(() => {
    load();
    api.getSettings().then(s => s.currency && setCurrency(s.currency)).catch(() => {});
  }, []);

  const del = async (id) => {
    if (confirm('Supprimer cette facture ?')) { await api.deleteInvoice(id); load(); }
  };

  const fmt = (n) => `${parseFloat(n || 0).toFixed(2)} ${currency}`;

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Factures</h2>
          <p className="text-gray-500 text-sm mt-1">{invoices.length} facture(s) au total</p>
        </div>
        <Link to="/invoices/new" className="btn-primary">+ Nouvelle facture</Link>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'draft', 'sent', 'paid', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === s ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {s === 'all' ? 'Toutes' : statusLabel[s]}
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-gray-500">Aucune facture pour ce filtre.</p>
            <Link to="/invoices/new" className="btn-primary mt-4 inline-flex">Créer une facture</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {['N°', 'Client', 'Émission', 'Échéance', 'Statut', 'Total', ''].map(h => (
                  <th key={h} className="py-3 px-2 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2">
                    <Link to={`/invoices/${inv.id}`} className="font-mono text-sm text-primary-600 hover:underline font-medium">{inv.number}</Link>
                  </td>
                  <td className="py-3 px-2 text-gray-700 font-medium">{inv.client_name}</td>
                  <td className="py-3 px-2 text-gray-400">{inv.issue_date}</td>
                  <td className="py-3 px-2 text-gray-400">{inv.due_date}</td>
                  <td className="py-3 px-2"><span className={statusStyle[inv.status]}>{statusLabel[inv.status]}</span></td>
                  <td className="py-3 px-2 font-bold text-gray-900">{fmt(inv.total)}</td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1.5 justify-end">
                      <Link to={`/invoices/${inv.id}`} className="btn-secondary text-xs py-1">Voir</Link>
                      <Link to={`/invoices/${inv.id}/edit`} className="btn-secondary text-xs py-1">Modifier</Link>
                      <button onClick={() => del(inv.id)} className="btn text-xs py-1 text-red-500 hover:bg-red-50">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
