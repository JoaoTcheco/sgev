// Camada SQLite local — better-sqlite3
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

let db = null;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('admin','pharmacist','cashier')),
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS pharmacy_settings (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  name TEXT,
  nuit TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  receipt_header TEXT,
  receipt_footer TEXT,
  receipt_size TEXT DEFAULT '80mm',
  currency TEXT DEFAULT 'MZN',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nuit TEXT,
  contact TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nuit TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  barcode TEXT UNIQUE,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  unit TEXT DEFAULT 'cx',
  sub_unit_label TEXT,
  pack_size INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  sub_price NUMERIC,
  cost_price NUMERIC DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  requires_prescription INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  batch_number TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_batches_product ON batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);

CREATE TABLE IF NOT EXISTS cash_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT,
  opening_amount NUMERIC NOT NULL DEFAULT 0,
  counted_amount NUMERIC,
  expected_amount NUMERIC,
  difference NUMERIC,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed'))
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  receipt_number TEXT UNIQUE,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  cash_session_id TEXT REFERENCES cash_sessions(id),
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','mpesa','emola','bank')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed','cancelled')),
  amount_received NUMERIC,
  change_due NUMERIC,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_receipt ON sales(receipt_number);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  batch_id TEXT REFERENCES batches(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  unit_kind TEXT DEFAULT 'pack',
  unit_label TEXT
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  batch_id TEXT REFERENCES batches(id) ON DELETE SET NULL,
  product_id TEXT NOT NULL REFERENCES products(id),
  type TEXT NOT NULL CHECK(type IN ('in','out','adjust')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_id TEXT,
  user_id TEXT REFERENCES profiles(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  batch_id TEXT REFERENCES batches(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

function ensureColumn(database, table, column, ddl) {
  const cols = database.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

function initDatabase(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new Database(filePath);
  db.exec(SCHEMA);

  // Migrations — colunas adicionadas em versões posteriores
  ensureColumn(db, "products", "manufacturer", "TEXT");
  ensureColumn(db, "products", "ideal_stock", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "products", "tarja", "TEXT");
  ensureColumn(db, "products", "active_ingredient", "TEXT");

  const settings = db.prepare("SELECT id FROM pharmacy_settings WHERE id = 1").get();
  if (!settings) {
    db.prepare(
      "INSERT INTO pharmacy_settings (id, name, currency, receipt_size) VALUES (1, ?, 'MZN', '80mm')",
    ).run("Farmácia");
  }
  return db;
}

function getDb() {
  return db;
}

module.exports = { initDatabase, getDb };
