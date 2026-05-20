import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { generatePDF } from '../utils/pdf';

const statusStyle = {
  draft: 'badge bg-gray-100 text-gray-700',
  sent: 'badge bg-yellow-50 text-yellow-700',
  paid: 'badge bg-green-50 text-green-700',
  cancelled: 'badge bg-red-50 text-red-600',
};
const statusLabel = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', cancelled: 'Annulée' };

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.getInvoice(id).then(setInvoice);
    api.getSettings().then(setSettings);
  }, [id]);

  if (!invoice) return <div className="p-8 text-center text-gray-400">Chargement…</div>;

  const currency = settings.currency || 'EUR';
  const fmt = (n) => `${parseFloat(n || 0).toFixed(2)} ${currency}`;
  const subtotal = (invoice.items || []).reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const taxAmt = subtotal * ((invoice.tax_rate || 0) / 100);

  const changeStatus = async (status) => {
    await api.updateStatus(id, status);
    setInvoice(i => ({ ...i, status }));
  };

  const del = async () => {
    if (confirm('Supprimer cette facture ?')) { await api.deleteInvoice(id); navigate('/invoices'); }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/invoices" className="text-sm text-gray-400 hover:text-gray-600">← Retour aux factures</Link>
          <h2 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-3">
            {invoice.number}
            <span className={statusStyle[invoice.status]}>{statusLabel[invoice.status]}</span>
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => generatePDF(invoice, settings)} className="btn-secondary">📄 PDF</button>
          <Link to={`/invoices/${id}/edit`} className="btn-secondary">✏️ Modifier</Link>
          <button onClick={del} className="btn-danger">🗑️ Supprimer</button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">De</p>
            <p className="font-bold text-gray-900">{settings.business_name}</p>
            <p className="text-sm text-gray-500">{settings.business_email}</p>
            <p className="text-sm text-gray-500">{settings.business_phone}</p>
            <p className="text-sm text-gray-500">{settings.business_address}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Facturer à</p>
            <p className="font-bold text-gray-900">{invoice.client_name}</p>
            {invoice.client_company && <p className="text-sm text-gray-500">{invoice.client_company}</p>}
            <p className="text-sm text-gray-500">{invoice.client_email}</p>
            {invoice.client_address && <p className="text-sm text-gray-500">{invoice.client_address}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl text-sm">
          <div><p className="text-gray-400 text-xs mb-1">Date d'émission</p><p className="font-medium">{invoice.issue_date}</p></div>
          <div><p className="text-gray-400 text-xs mb-1">Date d'échéance</p><p className="font-medium">{invoice.due_date}</p></div>
          <div><p className="text-gray-400 text-xs mb-1">TVA</p><p className="font-medium">{invoice.tax_rate || 0}%</p></div>
        </div>
      </div>

      <div className="card mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 text-gray-500 font-medium">Description</th>
              <th className="text-center py-2 text-gray-500 font-medium w-20">Qté</th>
              <th className="text-right py-2 text-gray-500 font-medium w-28">Prix unit.</th>
              <th className="text-right py-2 text-gray-500 font-medium w-28">Total</th>
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
        <div className="mt-4 space-y-2 text-sm border-t border-gray-100 pt-4">
          <div className="flex justify-between text-gray-500"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
          <div className="flex justify-between text-gray-500"><span>TVA ({invoice.tax_rate || 0}%)</span><span>{fmt(taxAmt)}</span></div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100 text-primary-600">
            <span>Total</span><span>{fmt(invoice.total)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="card mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Notes</p>
          <p className="text-sm text-gray-600">{invoice.notes}</p>
        </div>
      )}

      <div className="card">
        <p className="text-sm font-semibold text-gray-700 mb-3">Changer le statut</p>
        <div className="flex gap-2 flex-wrap">
          {['draft', 'sent', 'paid', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              disabled={invoice.status === s}
              className={`btn text-sm ${invoice.status === s ? 'bg-primary-600 text-white' : 'btn-secondary'}`}
            >
              {statusLabel[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
