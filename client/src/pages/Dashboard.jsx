import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const statusStyle = {
  draft: 'badge bg-gray-100 text-gray-600',
  sent: 'badge bg-warning-50 text-warning-600',
  paid: 'badge bg-success-50 text-success-600',
  cancelled: 'badge bg-danger-50 text-danger-500',
};
const statusLabel = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', cancelled: 'Annulée' };

export default function Dashboard() {
  const [stats, setStats] = useState({ earned: 0, pending: 0, invoiceCount: 0, clientCount: 0 });
  const [invoices, setInvoices] = useState([]);
  const [currency, setCurrency] = useState('EUR');

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
    api.getInvoices().then(d => setInvoices(d.slice(0, 5))).catch(() => {});
    api.getSettings().then(s => s.currency && setCurrency(s.currency)).catch(() => {});
  }, []);

  const fmt = (n) => `${parseFloat(n || 0).toFixed(2)} ${currency}`;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
          <p className="text-gray-500 text-sm mt-1">Bienvenue ! Voici un aperçu de ton activité.</p>
        </div>
        <Link to="/invoices/new" className="btn-primary">
          <span>+</span> Nouvelle facture
        </Link>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Revenus encaissés" value={fmt(stats.earned)} icon="💰" color="bg-success-50" />
        <StatCard label="En attente" value={fmt(stats.pending)} icon="⏳" color="bg-warning-50" />
        <StatCard label="Factures" value={stats.invoiceCount} icon="🧾" color="bg-primary-50" />
        <StatCard label="Clients" value={stats.clientCount} icon="👥" color="bg-purple-50" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Dernières factures</h3>
          <Link to="/invoices" className="text-sm text-primary-600 hover:underline">Voir tout →</Link>
        </div>
        {invoices.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-gray-500 text-sm">Aucune facture pour l'instant.</p>
            <Link to="/invoices/new" className="btn-primary mt-4 inline-flex">Créer ma première facture</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium">N°</th>
                <th className="text-left py-2 text-gray-500 font-medium">Client</th>
                <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                <th className="text-left py-2 text-gray-500 font-medium">Statut</th>
                <th className="text-right py-2 text-gray-500 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3">
                    <Link to={`/invoices/${inv.id}`} className="font-mono text-primary-600 hover:underline">{inv.number}</Link>
                  </td>
                  <td className="py-3 text-gray-700">{inv.client_name}</td>
                  <td className="py-3 text-gray-500">{inv.issue_date}</td>
                  <td className="py-3"><span className={statusStyle[inv.status]}>{statusLabel[inv.status]}</span></td>
                  <td className="py-3 text-right font-semibold">{fmt(inv.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
