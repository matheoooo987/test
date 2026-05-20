import { useEffect, useState } from 'react';
import { api } from '../utils/api';

const tabs = ['Entreprise', 'Facturation', 'Email SMTP', 'Apparence'];

export default function Settings() {
  const [form, setForm] = useState({
    business_name: '', business_email: '', business_phone: '',
    business_address: '', business_siret: '', currency: 'EUR',
    invoice_prefix: 'FAC-', quote_prefix: 'DEV-',
    default_tax_rate: '20', default_payment_terms: '30',
    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '', smtp_from: '',
  });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => { api.getSettings().then(s => setForm(f => ({ ...f, ...s }))); }, []);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.updateSettings(form);
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="page-title">⚙️ Paramètres</h2>
        <p className="page-sub">Configuration de ton compte FreelanceFlow</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === i ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Entreprise */}
        {activeTab === 0 && (
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">🏢 Informations entreprise</h3>
            <div><label className="label">Nom / Prénom Nom</label><input className="input" value={form.business_name} onChange={set('business_name')} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Email</label><input className="input" type="email" value={form.business_email} onChange={set('business_email')} /></div>
              <div><label className="label">Téléphone</label><input className="input" value={form.business_phone} onChange={set('business_phone')} /></div>
            </div>
            <div><label className="label">Adresse complète</label><textarea className="input resize-none" rows={2} value={form.business_address} onChange={set('business_address')} /></div>
            <div><label className="label">SIRET (optionnel)</label><input className="input" placeholder="XXX XXX XXX XXXXX" value={form.business_siret} onChange={set('business_siret')} /></div>
          </div>
        )}

        {/* Facturation */}
        {activeTab === 1 && (
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">💱 Préférences de facturation</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Devise</label>
                <select className="input" value={form.currency} onChange={set('currency')}>
                  {[['EUR','€'],['USD','$'],['GBP','£'],['CAD','$ CAD'],['CHF','Fr'],['MAD','DH']].map(([v,l]) => (
                    <option key={v} value={v}>{v} ({l})</option>
                  ))}
                </select>
              </div>
              <div><label className="label">TVA par défaut (%)</label><input className="input" type="number" value={form.default_tax_rate} onChange={set('default_tax_rate')} /></div>
              <div><label className="label">Préfixe factures</label><input className="input" value={form.invoice_prefix} onChange={set('invoice_prefix')} /></div>
              <div><label className="label">Préfixe devis</label><input className="input" value={form.quote_prefix} onChange={set('quote_prefix')} /></div>
              <div><label className="label">Délai paiement (jours)</label><input className="input" type="number" value={form.default_payment_terms} onChange={set('default_payment_terms')} /></div>
            </div>
          </div>
        )}

        {/* SMTP */}
        {activeTab === 2 && (
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">📧 Configuration Email SMTP</h3>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-400">
              💡 Pour Gmail : host = smtp.gmail.com, port = 587. Active "Accès moins sécurisé" ou utilise un mot de passe d'application.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Host SMTP</label><input className="input" placeholder="smtp.gmail.com" value={form.smtp_host} onChange={set('smtp_host')} /></div>
              <div><label className="label">Port</label><input className="input" type="number" value={form.smtp_port} onChange={set('smtp_port')} /></div>
              <div><label className="label">Utilisateur</label><input className="input" type="email" value={form.smtp_user} onChange={set('smtp_user')} /></div>
              <div><label className="label">Mot de passe</label><input className="input" type="password" value={form.smtp_pass} onChange={set('smtp_pass')} /></div>
            </div>
            <div><label className="label">Email expéditeur (optionnel)</label><input className="input" type="email" placeholder="noreply@monentreprise.com" value={form.smtp_from} onChange={set('smtp_from')} /></div>
          </div>
        )}

        {/* Apparence */}
        {activeTab === 3 && (
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">🎨 Apparence</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Le mode sombre/clair se bascule via le bouton en bas de la barre latérale.
            </p>
            <div className="p-4 bg-gradient-to-br from-primary-50 dark:from-primary-900/20 to-blue-50 dark:to-blue-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
              <h4 className="font-semibold text-primary-900 dark:text-primary-300 mb-2">💡 Comment maximiser tes revenus ?</h4>
              <ul className="text-sm text-primary-700 dark:text-primary-400 space-y-1.5 list-disc list-inside">
                <li>Crée des devis, attends l'accord client, convertis en facture en 1 clic</li>
                <li>Utilise le time tracker pour facturer chaque heure passée</li>
                <li>Envoie les factures par email directement depuis l'app</li>
                <li>Partage le lien public de la facture à ton client</li>
                <li>Suis tes dépenses déductibles pour optimiser tes impôts</li>
                <li>Analyse tes revenus mensuels dans la page Analytiques</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button type="submit" className="btn-primary px-8">💾 Enregistrer</button>
          {saved && <p className="text-green-600 dark:text-green-400 text-sm font-medium animate-pulse">✅ Sauvegardé !</p>}
        </div>
      </form>
    </div>
  );
}
