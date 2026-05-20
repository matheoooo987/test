import { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function Settings() {
  const [form, setForm] = useState({ business_name: '', business_email: '', business_phone: '', business_address: '', currency: 'EUR', invoice_prefix: 'FAC-' });
  const [saved, setSaved] = useState(false);

  useEffect(() => { api.getSettings().then(s => setForm(f => ({ ...f, ...s }))); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
        <p className="text-gray-500 text-sm mt-1">Informations qui apparaîtront sur vos factures.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">🏢 Mon entreprise</h3>
          <div>
            <label className="label">Nom de l'entreprise / Prénom Nom</label>
            <input className="input" value={form.business_name} onChange={set('business_name')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.business_email} onChange={set('business_email')} />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" value={form.business_phone} onChange={set('business_phone')} />
            </div>
          </div>
          <div>
            <label className="label">Adresse complète</label>
            <textarea className="input resize-none" rows={2} value={form.business_address} onChange={set('business_address')} />
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">💱 Facturation</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Devise</label>
              <select className="input" value={form.currency} onChange={set('currency')}>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="CHF">CHF (Fr)</option>
              </select>
            </div>
            <div>
              <label className="label">Préfixe des factures</label>
              <input className="input" value={form.invoice_prefix} onChange={set('invoice_prefix')} placeholder="FAC-" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" className="btn-primary px-6">💾 Enregistrer</button>
          {saved && <p className="text-green-600 text-sm font-medium">✅ Paramètres sauvegardés !</p>}
        </div>
      </form>

      <div className="card mt-6 bg-gradient-to-br from-primary-50 to-blue-50 border-primary-100">
        <h3 className="font-semibold text-primary-900 mb-2">💡 Comment générer de l'argent avec FreelanceFlow ?</h3>
        <ul className="text-sm text-primary-700 space-y-1.5 list-disc list-inside">
          <li>Utilise cette app pour facturer tes clients freelance directement</li>
          <li>Exporte tes factures en PDF professionnel en 1 clic</li>
          <li>Propose cette app en SaaS à d'autres freelances (~10€/mois)</li>
          <li>Suis tes revenus encaissés vs en attente sur le dashboard</li>
        </ul>
      </div>
    </div>
  );
}
