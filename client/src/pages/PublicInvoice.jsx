import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { generatePDF } from '../utils/pdf';

const statusLabel = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée ✓', cancelled: 'Annulée' };
const statusColor = { draft: '#9ca3af', sent: '#f59e0b', paid: '#22c55e', cancelled: '#ef4444' };

export default function PublicInvoice() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPublicInvoice(token)
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Facture introuvable'));
  }, [token]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><p className="text-6xl mb-4">❌</p><p className="text-gray-600">{error}</p></div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">Chargement…</p>
    </div>
  );

  const { invoice, settings } = data;
  const currency = settings.currency || 'EUR';
  const fmt = (n) => `${parseFloat(n || 0).toFixed(2)} ${currency}`;
  const subtotal = (invoice.items || []).reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const discounted = subtotal - subtotal * ((invoice.discount || 0) / 100);
  const taxAmt = discounted * ((invoice.tax_rate || 0) / 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-8" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-white">{settings.business_name}</h1>
                <p className="text-blue-200 text-sm mt-1">{settings.business_email}</p>
                <p className="text-blue-200 text-sm">{settings.business_address}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-sm">FACTURE</p>
                <p className="text-3xl font-bold text-white">{invoice.number}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: statusColor[invoice.status] + '40', border: `1px solid ${statusColor[invoice.status]}` }}>
                  {statusLabel[invoice.status]}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Dates & Client */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Client</p>
                <p className="font-bold text-gray-900">{invoice.client_name}</p>
                {invoice.client_company && <p className="text-gray-500 text-sm">{invoice.client_company}</p>}
                <p className="text-gray-500 text-sm">{invoice.client_email}</p>
              </div>
              <div className="text-right">
                <div className="space-y-1">
                  <div><span className="text-xs text-gray-400">Émise le </span><span className="text-sm font-medium">{invoice.issue_date}</span></div>
                  <div><span className="text-xs text-gray-400">À payer avant le </span><span className="text-sm font-bold text-red-500">{invoice.due_date}</span></div>
                </div>
              </div>
            </div>

            {/* Items */}
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-3 text-gray-500 font-medium">Description</th>
                  <th className="text-center py-3 text-gray-500 font-medium w-16">Qté</th>
                  <th className="text-right py-3 text-gray-500 font-medium w-28">Prix unit.</th>
                  <th className="text-right py-3 text-gray-500 font-medium w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-3 text-gray-700">{item.description}</td>
                    <td className="py-3 text-center text-gray-500">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-500">{fmt(item.unit_price)}</td>
                    <td className="py-3 text-right font-medium">{fmt(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totaux */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-6">
              <div className="flex justify-between text-gray-500"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
              {(invoice.discount || 0) > 0 && <div className="flex justify-between text-red-500"><span>Remise ({invoice.discount}%)</span><span>-{fmt(subtotal * (invoice.discount / 100))}</span></div>}
              <div className="flex justify-between text-gray-500"><span>TVA ({invoice.tax_rate || 0}%)</span><span>{fmt(taxAmt)}</span></div>
              <div className="flex justify-between font-bold text-xl pt-2 border-t border-gray-200">
                <span>Total à payer</span><span className="text-primary-600">{fmt(invoice.total)}</span>
              </div>
            </div>

            {invoice.notes && (
              <div className="bg-yellow-50 rounded-xl p-4 mb-6 text-sm text-gray-600 border border-yellow-100">
                <p className="font-medium text-gray-700 mb-1">Notes</p>
                <p>{invoice.notes}</p>
              </div>
            )}

            <button onClick={() => generatePDF(invoice, settings)} className="w-full btn-secondary justify-center">
              📄 Télécharger en PDF
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">Propulsé par FreelanceFlow</p>
      </div>
    </div>
  );
}
