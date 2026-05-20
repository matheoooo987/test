const BASE = '/api';

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error || 'Erreur serveur');
  }
  return res.json();
}

export const api = {
  getClients: () => req('/clients'),
  getClient: (id) => req(`/clients/${id}`),
  createClient: (data) => req('/clients', { method: 'POST', body: data }),
  updateClient: (id, data) => req(`/clients/${id}`, { method: 'PUT', body: data }),
  deleteClient: (id) => req(`/clients/${id}`, { method: 'DELETE' }),

  getInvoices: () => req('/invoices'),
  getInvoice: (id) => req(`/invoices/${id}`),
  getStats: () => req('/invoices/stats'),
  createInvoice: (data) => req('/invoices', { method: 'POST', body: data }),
  updateInvoice: (id, data) => req(`/invoices/${id}`, { method: 'PUT', body: data }),
  updateStatus: (id, status) => req(`/invoices/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteInvoice: (id) => req(`/invoices/${id}`, { method: 'DELETE' }),

  getQuotes: () => req('/quotes'),
  getQuote: (id) => req(`/quotes/${id}`),
  createQuote: (data) => req('/quotes', { method: 'POST', body: data }),
  updateQuote: (id, data) => req(`/quotes/${id}`, { method: 'PUT', body: data }),
  updateQuoteStatus: (id, status) => req(`/quotes/${id}/status`, { method: 'PATCH', body: { status } }),
  convertQuote: (id) => req(`/quotes/${id}/convert`, { method: 'POST' }),
  deleteQuote: (id) => req(`/quotes/${id}`, { method: 'DELETE' }),

  getTimeEntries: () => req('/time-entries'),
  createTimeEntry: (data) => req('/time-entries', { method: 'POST', body: data }),
  updateTimeEntry: (id, data) => req(`/time-entries/${id}`, { method: 'PUT', body: data }),
  deleteTimeEntry: (id) => req(`/time-entries/${id}`, { method: 'DELETE' }),
  timeToInvoice: (data) => req('/time-entries/to-invoice', { method: 'POST', body: data }),

  getExpenses: () => req('/expenses'),
  getExpenseStats: () => req('/expenses/stats'),
  createExpense: (data) => req('/expenses', { method: 'POST', body: data }),
  updateExpense: (id, data) => req(`/expenses/${id}`, { method: 'PUT', body: data }),
  deleteExpense: (id) => req(`/expenses/${id}`, { method: 'DELETE' }),

  getAnalytics: () => req('/analytics'),

  sendInvoiceEmail: (id, data) => req(`/email/invoice/${id}`, { method: 'POST', body: data }),

  getSettings: () => req('/settings'),
  updateSettings: (data) => req('/settings', { method: 'PUT', body: data }),

  getPublicInvoice: (token) => fetch(`/api/public/invoice/${token}`).then(r => r.json()),
};
