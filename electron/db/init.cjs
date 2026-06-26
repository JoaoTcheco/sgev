// SQLite initialization, schema apply, seed
const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

let db = null;

function uuid() { return crypto.randomUUID(); }

function applySchema(database) {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  database.exec(sql);
}

function seed(database) {
  // Pharmacy settings row
  database.prepare(`INSERT OR IGNORE INTO pharmacy_settings (id, name) VALUES (1, 'PharmaSys')`).run();

  // System "Caixa" account
  const caixa = database.prepare(`SELECT id FROM financial_accounts WHERE is_system = 1 AND name = 'Caixa'`).get();
  if (!caixa) {
    database.prepare(`INSERT INTO financial_accounts (id, name, kind, is_system) VALUES (?, 'Caixa', 'cash', 1)`).run(uuid());
  }

  // Default admin user on first run
  const anyUser = database.prepare(`SELECT id FROM users LIMIT 1`).get();
  if (!anyUser) {
    const id = uuid();
    const hash = bcrypt.hashSync('PharmaAdmin@2026', 10);
    database.prepare(`INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`).run(id, 'admin@pharmasys.local', hash);
    database.prepare(`INSERT INTO profiles (id, full_name, email, active) VALUES (?, 'Administrador', 'admin@pharmasys.local', 1)`).run(id);
    database.prepare(`INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')`).run(uuid(), id);
  }
}

function initDatabase(dbPath) {
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  applySchema(db);
  seed(db);
  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

module.exports = { initDatabase, getDb, uuid };
