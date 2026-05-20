const BASE = '/api';

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  // Clients
  getClients: () => req('/clients'),
  getClient: (id) => req(`/clients/${id}`),
  createClient: (data) => req('/clients', { method: 'POST', body: data }),
  updateClient: (id, data) => req(`/clients/${id}`, { method: 'PUT', body: data }),
  deleteClient: (id) => req(`/clients/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: () => req('/invoices'),
  getInvoice: (id) => req(`/invoices/${id}`),
  getStats: () => req('/invoices/stats'),
  createInvoice: (data) => req('/invoices', { method: 'POST', body: data }),
  updateInvoice: (id, data) => req(`/invoices/${id}`, { method: 'PUT', body: data }),
  updateStatus: (id, status) => req(`/invoices/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteInvoice: (id) => req(`/invoices/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => req('/settings'),
  updateSettings: (data) => req('/settings', { method: 'PUT', body: data }),
};
