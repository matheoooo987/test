import { useEffect, useState } from 'react';
import { api } from '../utils/api';

function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState(client || { name: '', email: '', phone: '', address: '', company: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (client?.id) await api.updateClient(client.id, form);
      else await api.createClient(form);
      onSave();
    } catch (err) { alert('Erreur : ' + err.message); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-modal-backdrop">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-800 animate-modal-content">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 dark:text-white">{client?.id ? 'Modifier le client' : 'Nouveau client'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Nom *</label>
            <input className="input" value={form.name} onChange={set('name')} required placeholder="Jean Dupont" />
          </div>
          <div>
            <label className="label">Entreprise</label>
            <input className="input" value={form.company} onChange={set('company')} placeholder="ACME Corp" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="jean@exemple.com" />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={form.phone} onChange={set('phone')} placeholder="+33 6 12 34 56 78" />
          </div>
          <div>
            <label className="label">Adresse</label>
            <textarea className="input resize-none" rows={2} value={form.address} onChange={set('address')} placeholder="12 rue de la Paix, 75001 Paris" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? '⏳ Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');

  const load = () => api.getClients().then(setClients);
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (confirm('Supprimer ce client ?')) { await api.deleteClient(id); load(); }
  };

  const filtered = clients.filter(c =>
    [c.name, c.email, c.company].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-4xl mx-auto animate-page">
      {modal !== undefined && modal !== false && (
        <ClientModal client={modal} onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />
      )}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-gray-500 text-sm mt-1">{clients.length} client(s) enregistré(s)</p>
        </div>
        <button onClick={() => setModal(null)} className="btn-primary">+ Nouveau client</button>
      </div>

      <div className="card">
        <div className="mb-4">
          <input className="input max-w-xs" placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-500">Aucun client trouvé.</p>
            <button onClick={() => setModal(null)} className="btn-primary mt-4">Ajouter un client</button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c, i) => (
              <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40 border border-gray-50 dark:border-gray-800/50 animate-list-item" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-700 text-sm flex-shrink-0">
                  {c.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                  {c.company && <p className="text-xs text-gray-400">{c.company}</p>}
                  <p className="text-xs text-gray-400">{c.email} {c.phone && `· ${c.phone}`}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModal(c)} className="btn-secondary text-xs py-1.5">Modifier</button>
                  <button onClick={() => del(c.id)} className="btn text-xs py-1.5 text-danger-500 hover:bg-danger-50">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
