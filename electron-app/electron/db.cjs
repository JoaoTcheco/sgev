const Database = require("better-sqlite3");

function openDb(filePath) {
  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS local_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY REFERENCES local_users(id) ON DELETE CASCADE,
      full_name TEXT,
      email TEXT,
      avatar_url TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES local_users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('admin','pharmacist','cashier')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, role)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      legal_name TEXT NOT NULL,
      trade_name TEXT,
      tax_id TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      contact_person TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      tax_id TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      barcode TEXT,
      manufacturer TEXT,
      active_ingredient TEXT,
      category_id TEXT REFERENCES categories(id),
      unit TEXT DEFAULT 'cx',
      pack_size INTEGER NOT NULL DEFAULT 1,
      sub_unit_label TEXT,
      sub_unit_price REAL,
      cost_price REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 0,
      ideal_stock INTEGER NOT NULL DEFAULT 0,
      tarja TEXT CHECK(tarja IN ('livre','amarela','vermelha','preta')),
      requires_prescription INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      supplier_id TEXT REFERENCES suppliers(id),
      batch_number TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      cost_price REAL NOT NULL DEFAULT 0,
      received_at TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_batches_product ON batches(product_id);

    CREATE TABLE IF NOT EXISTS cash_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES local_users(id),
      opened_at TEXT NOT NULL DEFAULT (datetime('now')),
      closed_at TEXT,
      opening_amount REAL NOT NULL DEFAULT 0,
      counted_amount REAL,
      expected_amount REAL,
      difference REAL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_one_open
      ON cash_sessions(user_id) WHERE status = 'open';

    CREATE TABLE IF NOT EXISTS sales_receipt_seq (
      year TEXT PRIMARY KEY,
      n INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      customer_id TEXT REFERENCES customers(id),
      user_id TEXT NOT NULL REFERENCES local_users(id),
      cash_session_id TEXT REFERENCES cash_sessions(id),
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','card','mpesa','emola','transfer','other')),
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed','cancelled')),
      receipt_number TEXT UNIQUE,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(id),
      batch_id TEXT REFERENCES batches(id),
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      unit_kind TEXT,
      unit_label TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      batch_id TEXT REFERENCES batches(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      type TEXT NOT NULL CHECK(type IN ('in','out','adjust')),
      quantity INTEGER NOT NULL,
      reason TEXT,
      user_id TEXT REFERENCES local_users(id),
      reference_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('low_stock','near_expiry','expired')),
      severity TEXT NOT NULL DEFAULT 'info' CHECK(severity IN ('info','warning','critical')),
      product_id TEXT REFERENCES products(id),
      batch_id TEXT REFERENCES batches(id),
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES local_users(id),
      entity TEXT NOT NULL,
      entity_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pharmacy_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
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
      receipt_footer TEXT DEFAULT 'Obrigado pela preferência!',
      show_pharmacist INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT OR IGNORE INTO pharmacy_settings (id, name, slogan, address, city, phone, email, receipt_footer)
      VALUES (1, 'PharmaSys', 'A sua saúde, a nossa missão', 'Av. 25 de Setembro, nº 123', 'Maputo, Moçambique', '+258 84 000 0000', 'geral@pharmasys.mz', 'Obrigado pela preferência! Volte sempre.');

    -- Some default categories
    INSERT OR IGNORE INTO categories(id, name) VALUES ('c-1','Analgésicos'),('c-2','Antibióticos'),('c-3','Vitaminas'),('c-4','Higiene'),('c-5','Cosmética');
  `);
}

module.exports = { openDb, runMigrations };
