import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import BarChart from '../components/BarChart';

function StatCard({ label, value, icon, sub, color = 'bg-primary-50 dark:bg-primary-900/20', trend, style }) {
  return (
    <div className="card card-interactive flex items-start gap-4 animate-list-item" style={style}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        {trend !== undefined && (
          <p className={`text-xs font-medium mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mois dernier
          </p>
        )}
      </div>
    </div>
  );
}

const statusStyle = {
  draft: 'badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  sent: 'badge bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  paid: 'badge bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  cancelled: 'badge bg-red-50 dark:bg-red-900/30 text-red-500',
};
const statusLabel = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', cancelled: 'Annulée' };

export default function Dashboard() {
  const [stats, setStats] = useState({ earned: 0, pending: 0, invoiceCount: 0, clientCount: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [currency, setCurrency] = useState('EUR');
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {});
    api.getInvoices().then(d => setInvoices(d.slice(0, 6))).catch(() => {});
    api.getAnalytics().then(setAnalytics).catch(() => {});
    api.getSettings().then(s => {
      if (s.currency) setCurrency(s.currency);
      if (s.business_name) setBusinessName(s.business_name);
    }).catch(() => {});
  }, []);

  const fmt = (n) => `${parseFloat(n || 0).toFixed(2)} ${currency}`;
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="p-6 max-w-6xl mx-auto animate-page">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting}{businessName ? `, ${businessName}` : ''} 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/quotes/new" className="btn-secondary text-sm">📋 Nouveau devis</Link>
          <Link to="/invoices/new" className="btn-primary">+ Nouvelle facture</Link>
        </div>
      </div>

      {/* Alertes */}
      {analytics?.overdue?.count > 0 && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400 text-sm">
              {analytics.overdue.count} facture(s) en retard — {fmt(analytics.overdue.total)} à encaisser d'urgence
            </p>
            <Link to="/invoices" className="text-xs text-red-600 dark:text-red-400 hover:underline">Voir les factures →</Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Revenus encaissés" value={fmt(stats.earned)} icon="💰" color="bg-green-50 dark:bg-green-900/20" style={{ animationDelay: '0ms' }} />
        <StatCard label="En attente" value={fmt(stats.pending)} icon="⏳" color="bg-yellow-50 dark:bg-yellow-900/20" style={{ animationDelay: '60ms' }} />
        <StatCard label="Factures" value={stats.invoiceCount} icon="🧾" color="bg-primary-50 dark:bg-primary-900/20"
          sub={analytics ? `Taux devis: ${analytics.quoteConversionRate}%` : undefined} style={{ animationDelay: '120ms' }} />
        <StatCard label="Clients" value={stats.clientCount} icon="👥" color="bg-purple-50 dark:bg-purple-900/20"
          sub={analytics?.avgInvoiceValue ? `Panier moy: ${fmt(analytics.avgInvoiceValue)}` : undefined} style={{ animationDelay: '180ms' }} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Chart */}
        <div className="card xl:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Revenus — 12 derniers mois</h3>
            <Link to="/analytics" className="text-xs text-primary-600 hover:underline">Voir tout →</Link>
          </div>
          <BarChart data={analytics?.monthly || []} height={150} />
        </div>

        {/* Top Clients */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🏆 Top clients</h3>
          {analytics?.topClients?.length > 0 ? (
            <div className="space-y-3">
              {analytics.topClients.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-300 dark:text-gray-600 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.invoice_count} facture(s)</p>
                  </div>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">{fmt(c.earned)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Aucune donnée</p>
          )}
        </div>
      </div>

      {/* KPIs supplémentaires */}
      {analytics && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-3xl font-bold text-primary-600">{analytics.hoursThisMonth}h</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Heures ce mois</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-red-500">{fmt(analytics.expensesYear)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dépenses cette année</p>
          </div>
          <div className="card text-center">
            <p className="text-3xl font-bold text-yellow-500">{analytics.quoteConversionRate}%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Taux conversion devis</p>
          </div>
        </div>
      )}

      {/* Dernières factures */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Dernières factures</h3>
          <Link to="/invoices" className="text-sm text-primary-600 hover:underline">Voir tout →</Link>
        </div>
        {invoices.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-gray-500 text-sm">Aucune facture. Commençons !</p>
            <Link to="/invoices/new" className="btn-primary mt-4 inline-flex">Créer ma première facture</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['N°', 'Client', 'Date', 'Échéance', 'Statut', 'Total'].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-gray-400 dark:text-gray-500 font-medium text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-2">
                      <Link to={`/invoices/${inv.id}`} className="font-mono text-primary-600 hover:underline font-medium">{inv.number}</Link>
                    </td>
                    <td className="py-3 px-2 text-gray-700 dark:text-gray-300 font-medium">{inv.client_name}</td>
                    <td className="py-3 px-2 text-gray-400 text-xs">{inv.issue_date}</td>
                    <td className="py-3 px-2 text-gray-400 text-xs">{inv.due_date}</td>
                    <td className="py-3 px-2"><span className={statusStyle[inv.status]}>{statusLabel[inv.status]}</span></td>
                    <td className="py-3 px-2 font-bold text-gray-900 dark:text-white">{fmt(inv.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
