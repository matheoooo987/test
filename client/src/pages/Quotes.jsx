import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const sStyle = {
  draft: 'badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  sent: 'badge bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  accepted: 'badge bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  refused: 'badge bg-red-50 dark:bg-red-900/30 text-red-500',
};
const sLabel = { draft: 'Brouillon', sent: 'Envoyé', accepted: 'Accepté', refused: 'Refusé' };

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [currency, setCurrency] = useState('EUR');
  const navigate = useNavigate();

  const load = () => api.getQuotes().then(setQuotes);
  useEffect(() => {
    load();
    api.getSettings().then(s => s.currency && setCurrency(s.currency)).catch(() => {});
  }, []);

  const fmt = (n) => `${parseFloat(n || 0).toFixed(2)} ${currency}`;

  const convert = async (id) => {
    try {
      const result = await api.convertQuote(id);
      alert(`✅ Devis converti en facture ${result.invoice_number} !`);
      navigate(`/invoices/${result.invoice_id}`);
    } catch (e) { alert('Erreur : ' + e.message); }
  };

  const del = async (id) => {
    if (confirm('Supprimer ce devis ?')) { await api.deleteQuote(id); load(); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h2 className="page-title">📋 Devis</h2>
          <p className="page-sub">{quotes.length} devis au total</p>
        </div>
        <Link to="/quotes/new" className="btn-primary">+ Nouveau devis</Link>
      </div>

      <div className="card">
        {quotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 dark:text-gray-400">Aucun devis. Crée-en un et convertis-le en facture en 1 clic !</p>
            <Link to="/quotes/new" className="btn-primary mt-4 inline-flex">Créer un devis</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['N°', 'Client', 'Émission', 'Valide jusqu\'au', 'Statut', 'Total', ''].map(h => (
                    <th key={h} className="text-left py-3 px-2 text-gray-400 dark:text-gray-500 font-medium text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotes.map(q => (
                  <tr key={q.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-2">
                      <Link to={`/quotes/${q.id}`} className="font-mono text-primary-600 hover:underline font-medium">{q.number}</Link>
                    </td>
                    <td className="py-3 px-2 text-gray-700 dark:text-gray-300 font-medium">{q.client_name}</td>
                    <td className="py-3 px-2 text-gray-400 text-xs">{q.issue_date}</td>
                    <td className="py-3 px-2 text-gray-400 text-xs">{q.valid_until}</td>
                    <td className="py-3 px-2"><span className={sStyle[q.status]}>{sLabel[q.status]}</span></td>
                    <td className="py-3 px-2 font-bold text-gray-900 dark:text-white">{fmt(q.total)}</td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1 justify-end">
                        {q.status !== 'accepted' && !q.converted_to_invoice && (
                          <button onClick={() => convert(q.id)} className="btn text-xs py-1 bg-green-50 dark:bg-green-900/30 text-green-600 hover:bg-green-100 dark:hover:bg-green-800/30">
                            → Facture
                          </button>
                        )}
                        {q.converted_to_invoice && (
                          <Link to={`/invoices/${q.converted_to_invoice}`} className="btn text-xs py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600">Voir facture</Link>
                        )}
                        <Link to={`/quotes/${q.id}/edit`} className="btn-secondary text-xs py-1">Modifier</Link>
                        <button onClick={() => del(q.id)} className="btn text-xs py-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">✕</button>
                      </div>
                    </td>
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
