import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import BarChart from '../components/BarChart';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [currency, setCurrency] = useState('EUR');

  useEffect(() => {
    api.getAnalytics().then(setData).catch(() => {});
    api.getSettings().then(s => s.currency && setCurrency(s.currency)).catch(() => {});
  }, []);

  const fmt = (n) => `${parseFloat(n || 0).toFixed(2)} ${currency}`;

  const statusLabel = { draft: 'Brouillons', sent: 'Envoyées', paid: 'Payées', cancelled: 'Annulées' };
  const statusColor = { draft: '#9ca3af', sent: '#f59e0b', paid: '#22c55e', cancelled: '#ef4444' };

  if (!data) return <div className="p-8 text-center text-gray-400">Chargement des analytiques…</div>;

  const totalInvoiced = data.statusDist?.reduce((s, d) => s + (d.total || 0), 0) || 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header mb-6">
        <div>
          <h2 className="page-title">📈 Analytiques</h2>
          <p className="page-sub">Vue complète de ta performance financière</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Valeur moy. facture', value: fmt(data.avgInvoiceValue), icon: '📊' },
          { label: 'Taux conv. devis', value: `${data.quoteConversionRate}%`, icon: '🎯' },
          { label: 'Heures ce mois', value: `${data.hoursThisMonth}h`, icon: '⏱️' },
          { label: 'Dépenses année', value: fmt(data.expensesYear), icon: '💸' },
        ].map(k => (
          <div key={k.label} className="card text-center">
            <span className="text-2xl">{k.icon}</span>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-2">{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Graphique mensuel */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revenus mensuels (12 derniers mois)</h3>
        <BarChart data={data.monthly || []} height={180} />
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
          <div>
            <p className="text-sm text-gray-400">Total encaissé</p>
            <p className="font-bold text-green-600">{fmt(data.monthly?.reduce((s, m) => s + (m.earned || 0), 0))}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total en attente</p>
            <p className="font-bold text-yellow-500">{fmt(data.monthly?.reduce((s, m) => s + (m.pending || 0), 0))}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Nb factures</p>
            <p className="font-bold text-primary-600">{data.monthly?.reduce((s, m) => s + (m.count || 0), 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Répartition statuts */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Répartition par statut</h3>
          <div className="space-y-3">
            {(data.statusDist || []).map(s => {
              const pct = totalInvoiced > 0 ? Math.round((s.total / totalInvoiced) * 100) : 0;
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{statusLabel[s.status] || s.status}</span>
                    <span className="font-medium">{s.count} · {fmt(s.total)}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: statusColor[s.status] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top clients */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🏆 Top 5 clients</h3>
          <div className="space-y-3">
            {(data.topClients || []).map((c, i) => {
              const maxEarned = data.topClients[0]?.earned || 1;
              const pct = Math.round((c.earned / maxEarned) * 100);
              return (
                <div key={c.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{i + 1}. {c.name}</span>
                    <span className="font-bold text-green-600">{fmt(c.earned)}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div className="h-2 rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(!data.topClients || data.topClients.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-4">Aucune donnée client</p>
            )}
          </div>
        </div>
      </div>

      {/* Alertes retards */}
      {data.overdue?.count > 0 && (
        <div className="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <h3 className="font-semibold text-red-700 dark:text-red-400 mb-1">⚠️ Factures en retard</h3>
          <p className="text-red-600 dark:text-red-300">
            <strong>{data.overdue.count}</strong> facture(s) dépassée(s) pour un total de <strong>{fmt(data.overdue.total)}</strong>.
            Envoie des relances dès maintenant !
          </p>
        </div>
      )}
    </div>
  );
}
