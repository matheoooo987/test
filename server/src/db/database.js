const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, '../../freelanceflow.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    company TEXT,
    siret TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL,
    client_id TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    notes TEXT,
    tax_rate REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total REAL DEFAULT 0,
    public_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    number TEXT NOT NULL,
    client_id TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    issue_date TEXT NOT NULL,
    valid_until TEXT NOT NULL,
    notes TEXT,
    tax_rate REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total REAL DEFAULT 0,
    converted_to_invoice TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS quote_items (
    id TEXT PRIMARY KEY,
    quote_id TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    project TEXT NOT NULL,
    description TEXT,
    start_time TEXT,
    end_time TEXT,
    duration INTEGER DEFAULT 0,
    hourly_rate REAL DEFAULT 0,
    billed INTEGER DEFAULT 0,
    invoice_id TEXT,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    client_id TEXT,
    deductible INTEGER DEFAULT 1,
    receipt_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

const defaultSettings = {
  business_name: 'Mon Entreprise',
  business_email: 'contact@monentreprise.com',
  business_phone: '+33 6 00 00 00 00',
  business_address: '123 Rue Example, 75000 Paris',
  business_siret: '',
  currency: 'EUR',
  invoice_prefix: 'FAC-',
  quote_prefix: 'DEV-',
  next_invoice_number: '1',
  next_quote_number: '1',
  default_tax_rate: '20',
  default_payment_terms: '30',
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_pass: '',
  smtp_from: '',
  theme: 'light',
};

for (const [key, value] of Object.entries(defaultSettings)) {
  const exists = db.prepare('SELECT key FROM settings WHERE key = ?').get(key);
  if (!exists) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }
}

// Add discount column if missing (migration)
try { db.exec('ALTER TABLE invoices ADD COLUMN discount REAL DEFAULT 0'); } catch {}
try { db.exec('ALTER TABLE invoices ADD COLUMN public_token TEXT'); } catch {}
try { db.exec('ALTER TABLE quotes ADD COLUMN discount REAL DEFAULT 0'); } catch {}
try { db.exec('ALTER TABLE clients ADD COLUMN siret TEXT'); } catch {}
try { db.exec('ALTER TABLE clients ADD COLUMN notes TEXT'); } catch {}

module.exports = db;
