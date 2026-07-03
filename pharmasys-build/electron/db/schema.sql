-- PharmaSys local schema (SQLite)
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin','pharmacist','cashier')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pharmacy_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'PharmaSys',
  slogan TEXT,
  nuit TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  receipt_width TEXT NOT NULL DEFAULT '80mm',
  receipt_header TEXT,
  receipt_footer TEXT,
  show_pharmacist INTEGER NOT NULL DEFAULT 1,
  label_layout TEXT NOT NULL DEFAULT 'a4',
  label_margin INTEGER NOT NULL DEFAULT 4,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  legal_name TEXT NOT NULL,
  tax_id TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  nuit TEXT,
  address TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  barcode TEXT UNIQUE,
  sub_barcode TEXT UNIQUE,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'cx',
  pack_size INTEGER NOT NULL DEFAULT 1,
  sub_unit_label TEXT,
  sub_unit_price REAL,
  sale_price REAL NOT NULL DEFAULT 0,
  cost_price REAL NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 5,
  expiry_alert_days INTEGER NOT NULL DEFAULT 60,
  active INTEGER NOT NULL DEFAULT 1,
  requires_prescription INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  batch_number TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  cost_price REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  txn_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_batches_product ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);

CREATE TABLE IF NOT EXISTS financial_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  balance REAL NOT NULL DEFAULT 0,
  is_system INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cash_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT,
  opening_amount REAL NOT NULL DEFAULT 0,
  counted_amount REAL,
  expected_amount REAL,
  difference REAL,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_user ON cash_sessions(user_id, status);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  sale_number INTEGER NOT NULL DEFAULT 0,
  receipt_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  cash_session_id TEXT REFERENCES cash_sessions(id),
  account_id TEXT REFERENCES financial_accounts(id),
  subtotal REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  batch_id TEXT REFERENCES batches(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total REAL NOT NULL,
  unit_kind TEXT NOT NULL DEFAULT 'pack',
  unit_label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  txn_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  batch_id TEXT REFERENCES batches(id) ON DELETE SET NULL,
  product_id TEXT NOT NULL REFERENCES products(id),
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  user_id TEXT REFERENCES users(id),
  reference_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  txn_id TEXT
);

CREATE TABLE IF NOT EXISTS account_movements (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  reason TEXT,
  sale_id TEXT REFERENCES sales(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  txn_id TEXT
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  batch_id TEXT REFERENCES batches(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  txn_id TEXT
);

CREATE TABLE IF NOT EXISTS receipt_seq (
  year INTEGER PRIMARY KEY,
  last_value INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_txn ON stock_movements(txn_id);
CREATE INDEX IF NOT EXISTS idx_account_movements_txn ON account_movements(txn_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_txn ON audit_logs(txn_id);
