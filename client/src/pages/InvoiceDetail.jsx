import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { generatePDF } from '../utils/pdf';

const statusStyle = {
  draft: 'badge bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  sent: 'badge bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  paid: 'badge bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  cancelled: 'badge bg-red-50 dark:bg-red-900/30 text-red-600',
};
const statusLabel = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', cancelled: 'Annulée' };

function EmailModal({ invoice, onClose }) {
  const [to, setTo] = useState(invoice.client_email || '');
  const [subject, setSubject] = useState(`Facture ${invoice.number}`);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    setSending(true); setErr('');
    try {
      await api.sendInvoiceEmail(invoice.id, { to, subject });
      setDone(true);
    } catch (e) { setErr(e.message); }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">📧 Envoyer par email</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          {done ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-2">✅</p>
              <p className="font-semibold text-green-600">Email envoyé avec succès !</p>
              <p className="text-sm text-gray-400 mt-1">La facture a été marquée comme "Envoyée"</p>
              <button onClick={onClose} className="btn-primary mt-4">Fermer</button>
            </div>
          ) : (
            <>
              <div><label className="label">Destinataire</label><input className="input" type="email" value={to} onChange={e => setTo(e.target.value)} /></div>
              <div><label className="label">Objet</label><input className="input" value={subject} onChange={e => setSubject(e.target.value)} /></div>
              {err && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{err}</p>}
              <p className="text-xs text-gray-400">Configure ton SMTP dans les Paramètres pour activer l'envoi email.</p>
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
                <button onClick={send} disabled={sending || !to} className="btn-primary flex-1">
                  {sending ? '⏳ Envoi…' : '📤 Envoyer'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState({});
  const [emailModal, setEmailModal] = useState(false);

  useEffect(() => {
    api.getInvoice(id).then(setInvoice);
    api.getSettings().then(setSettings);
  }, [id]);

  if (!invoice) return <div className="p-8 text-center text-gray-400">Chargement…</div>;

  const currency = settings.currency || 'EUR';
  const fmt = (n) => `${parseFloat(n || 0).toFixed(2)} ${currency}`;
  const subtotal = (invoice.items || []).reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const discounted = subtotal - subtotal * ((invoice.discount || 0) / 100);
  const taxAmt = discounted * ((invoice.tax_rate || 0) / 100);

  const changeStatus = async (status) => {
    await api.updateStatus(id, status);
    setInvoice(i => ({ ...i, status }));
  };

  const del = async () => {
    if (confirm('Supprimer cette facture ?')) { await api.deleteInvoice(id); navigate('/invoices'); }
  };

  const publicLink = invoice.public_token ? `${window.location.origin}/public/invoice/${invoice.public_token}` : null;

  const copyLink = () => { navigator.clipboard.writeText(publicLink); alert('Lien copié !'); };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {emailModal && <EmailModal invoice={invoice} onClose={() => setEmailModal(false)} />}

      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link to="/invoices" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-3 flex-wrap">
            {invoice.number}
            <span className={statusStyle[invoice.status]}>{statusLabel[invoice.status]}</span>
          </h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          {publicLink && <button onClick={copyLink} className="btn-secondary text-sm" title="Copier le lien public">🔗 Lien</button>}
          <button onClick={() => setEmailModal(true)} className="btn-secondary text-sm">📧 Email</button>
          <button onClick={() => generatePDF(invoice, settings)} className="btn-secondary text-sm">📄 PDF</button>
          <Link to={`/invoices/${id}/edit`} className="btn-secondary text-sm">✏️ Modifier</Link>
          <button onClick={del} className="btn-danger text-sm">🗑️</button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">De</p>
            <p className="font-bold text-gray-900 dark:text-white">{settings.business_name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{settings.business_email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{settings.business_phone}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{settings.business_address}</p>
            {settings.business_siret && <p className="text-xs text-gray-400 mt-1">SIRET : {settings.business_siret}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Facturer à</p>
            <p className="font-bold text-gray-900 dark:text-white">{invoice.client_name}</p>
            {invoice.client_company && <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.client_company}</p>}
            <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.client_email}</p>
            {invoice.client_address && <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.client_address}</p>}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm">
          <div><p className="text-gray-400 text-xs mb-1">Émission</p><p className="font-medium dark:text-white">{invoice.issue_date}</p></div>
          <div><p className="text-gray-400 text-xs mb-1">Échéance</p><p className="font-medium dark:text-white">{invoice.due_date}</p></div>
          <div><p className="text-gray-400 text-xs mb-1">TVA</p><p className="font-medium dark:text-white">{invoice.tax_rate || 0}%</p></div>
          <div><p className="text-gray-400 text-xs mb-1">Remise</p><p className="font-medium dark:text-white">{invoice.discount || 0}%</p></div>
        </div>
      </div>

      <div className="card mb-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {['Description', 'Qté', 'Prix unit.', 'Total'].map(h => (
                <th key={h} className={`py-2 text-gray-400 dark:text-gray-500 font-medium text-xs uppercase ${h === 'Description' ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, i) => (
              <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50">
                <td className="py-3 text-gray-700 dark:text-gray-300">{item.description}</td>
                <td className="py-3 text-right text-gray-500">{item.quantity}</td>
                <td className="py-3 text-right text-gray-500">{fmt(item.unit_price)}</td>
                <td className="py-3 text-right font-medium dark:text-white">{fmt(item.quantity * item.unit_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 space-y-2 text-sm border-t border-gray-100 dark:border-gray-800 pt-4">
          <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
          {(invoice.discount || 0) > 0 && <div className="flex justify-between text-red-500"><span>Remise ({invoice.discount}%)</span><span>-{fmt(subtotal * (invoice.discount / 100))}</span></div>}
          <div className="flex justify-between text-gray-500 dark:text-gray-400"><span>TVA ({invoice.tax_rate || 0}%)</span><span>{fmt(taxAmt)}</span></div>
          <div className="flex justify-between font-bold text-xl pt-2 border-t border-gray-100 dark:border-gray-800 text-primary-600">
            <span>Total</span><span>{fmt(invoice.total)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="card mb-4 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-800">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{invoice.notes}</p>
        </div>
      )}

      {publicLink && (
        <div className="card mb-4 bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800">
          <p className="text-xs text-primary-700 dark:text-primary-400 font-medium mb-1">🔗 Lien public (partager au client)</p>
          <div className="flex items-center gap-2">
            <input className="input text-xs flex-1 bg-white dark:bg-gray-800" readOnly value={publicLink} />
            <button onClick={copyLink} className="btn-primary text-xs">Copier</button>
          </div>
        </div>
      )}

      <div className="card">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Changer le statut</p>
        <div className="flex gap-2 flex-wrap">
          {['draft', 'sent', 'paid', 'cancelled'].map(s => (
            <button key={s} onClick={() => changeStatus(s)} disabled={invoice.status === s}
              className={`btn text-sm ${invoice.status === s ? 'bg-primary-600 text-white' : 'btn-secondary'}`}>
              {statusLabel[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
