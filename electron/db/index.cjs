const path = require("path");
const fs = require("fs");
const { app } = require("electron");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

let db;

function getDb() {
  if (!db) initDb();
  return db;
}

function initDb() {
  const dir = app
    ? app.getPath("userData")
    : path.join(process.env.APPDATA || process.cwd(), "PharmaSys");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, "pharmasys.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  db.exec(schema);
  migrate();

  seed();
  return db;
}

// Lightweight migrations for DBs created by older builds.
function migrate() {
  const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
  const has = (t, c) => cols(t).includes(c);

  // suppliers: rename legacy "name"/"nuit" → legal_name/tax_id
  if (has("suppliers", "name") && !has("suppliers", "legal_name")) {
    db.exec(`ALTER TABLE suppliers RENAME COLUMN name TO legal_name;`);
  }
  if (has("suppliers", "nuit") && !has("suppliers", "tax_id")) {
    db.exec(`ALTER TABLE suppliers RENAME COLUMN nuit TO tax_id;`);
  }
  if (!has("suppliers", "legal_name")) {
    db.exec(`ALTER TABLE suppliers ADD COLUMN legal_name TEXT NOT NULL DEFAULT '';`);
  }
  if (!has("suppliers", "tax_id")) db.exec(`ALTER TABLE suppliers ADD COLUMN tax_id TEXT;`);

  if (!has("financial_accounts", "created_by")) {
    db.exec(`ALTER TABLE financial_accounts ADD COLUMN created_by TEXT REFERENCES users(id);`);
  }
  if (!has("sales", "sale_number")) {
    db.exec(`ALTER TABLE sales ADD COLUMN sale_number INTEGER NOT NULL DEFAULT 0;`);
  }
}

function seed() {
  const userCount = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  if (userCount === 0) {
    const hash = bcrypt.hashSync("PharmaAdmin@2026", 10);
    db.prepare(
      "INSERT INTO users (id, username, password_hash, full_name, role, active) VALUES (?, ?, ?, ?, 'admin', 1)",
    ).run(randomUUID(), "admin", hash, "Administrador");
  }

  const accCount = db.prepare("SELECT COUNT(*) AS c FROM financial_accounts").get().c;
  if (accCount === 0) {
    db.prepare(
      "INSERT INTO financial_accounts (id, name, type, balance, is_system, active) VALUES (?, 'Caixa', 'cash', 0, 1, 1)",
    ).run(randomUUID());
  }

  const setCount = db.prepare("SELECT COUNT(*) AS c FROM pharmacy_settings").get().c;
  if (setCount === 0) {
    db.prepare(
      "INSERT INTO pharmacy_settings (id, name, receipt_width, show_pharmacist) VALUES (1, 'PharmaSys', '80mm', 1)",
    ).run();
  }
}

module.exports = { initDb, getDb };
