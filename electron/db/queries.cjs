// Generic + business queries for PharmaSys local DB
const { getDb } = require("./index.cjs");
const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");

// ---------- Whitelist of tables ----------
const TABLES = new Set([
  "users",
  "profiles", // alias of users for compat
  "user_roles", // virtual
  "pharmacy_settings",
  "categories",
  "suppliers",
  "customers",
  "products",
  "batches",
  "financial_accounts",
  "cash_sessions",
  "sales",
  "sale_items",
  "stock_movements",
  "account_movements",
  "alerts",
  "audit_logs",
]);

const OPS = {
  eq: "=",
  neq: "<>",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  like: "LIKE",
  ilike: "LIKE", // SQLite LIKE is case-insensitive for ASCII by default
};

function quoteIdent(name) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) throw new Error("Bad identifier: " + name);
  return '"' + name + '"';
}

function resolveTable(table) {
  if (!TABLES.has(table)) throw new Error("Unknown table: " + table);
  if (table === "profiles") return "users";
  return table;
}

// ---------- Auth ----------
const SESSION = { user: null };

function authSignIn({ username, password }) {
  const db = getDb();
  const u = db.prepare("SELECT * FROM users WHERE username = ? AND active = 1").get(username);
  if (!u) throw new Error("Utilizador ou palavra-passe inválidos");
  if (!bcrypt.compareSync(password, u.password_hash)) {
    throw new Error("Utilizador ou palavra-passe inválidos");
  }
  SESSION.user = { id: u.id, username: u.username, full_name: u.full_name, role: u.role, email: u.email };
  return SESSION.user;
}

function authSignOut() {
  SESSION.user = null;
  return true;
}

function authGetUser() {
  return SESSION.user;
}

function requireUser() {
  if (!SESSION.user) throw new Error("Não autenticado");
  return SESSION.user;
}

function requireAdmin() {
  const u = requireUser();
  if (u.role !== "admin") throw new Error("Permissão negada");
  return u;
}

function requireStaff() {
  const u = requireUser();
  if (!["admin", "pharmacist"].includes(u.role)) throw new Error("Permissão negada");
  return u;
}

// ---------- Generic SELECT ----------
function runSelect({ table, filters = [], order = [], limit, offset, single, maybeSingle, count }) {
  const db = getDb();
  const real = resolveTable(table);

  // Handle virtual user_roles
  if (table === "user_roles") {
    let sql = "SELECT id as id, id as user_id, role FROM users";
    const where = [];
    const params = [];
    for (const f of filters) {
      if (f.col === "user_id" && f.op === "eq") {
        where.push("id = ?");
        params.push(f.val);
      } else if (f.col === "role" && f.op === "eq") {
        where.push("role = ?");
        params.push(f.val);
      }
    }
    if (where.length) sql += " WHERE " + where.join(" AND ");
    const rows = db.prepare(sql).all(...params);
    return finalizeRows(rows, { single, maybeSingle });
  }

  let sql = `SELECT * FROM ${quoteIdent(real)}`;
  const where = [];
  const params = [];
  for (const f of filters) {
    if (f.op === "in") {
      if (!Array.isArray(f.val) || f.val.length === 0) {
        where.push("1=0");
        continue;
      }
      where.push(`${quoteIdent(f.col)} IN (${f.val.map(() => "?").join(",")})`);
      params.push(...f.val);
    } else if (f.op === "is") {
      if (f.val === null) where.push(`${quoteIdent(f.col)} IS NULL`);
      else where.push(`${quoteIdent(f.col)} IS ?`), params.push(f.val);
    } else if (f.op === "like" || f.op === "ilike") {
      where.push(`${quoteIdent(f.col)} LIKE ?`);
      params.push(String(f.val).replace(/\*/g, "%"));
    } else if (OPS[f.op]) {
      const v = typeof f.val === "boolean" ? (f.val ? 1 : 0) : f.val;
      where.push(`${quoteIdent(f.col)} ${OPS[f.op]} ?`);
      params.push(v);
    } else {
      throw new Error("Unsupported operator: " + f.op);
    }
  }
  if (where.length) sql += " WHERE " + where.join(" AND ");

  if (order && order.length) {
    sql += " ORDER BY " + order.map((o) => `${quoteIdent(o.col)} ${o.asc ? "ASC" : "DESC"}`).join(", ");
  }
  if (typeof limit === "number") sql += ` LIMIT ${limit | 0}`;
  if (typeof offset === "number") sql += ` OFFSET ${offset | 0}`;

  const rows = db.prepare(sql).all(...params);
  return finalizeRows(rows, { single, maybeSingle, count });
}

function finalizeRows(rows, { single, maybeSingle, count }) {
  if (single) {
    if (rows.length !== 1) throw new Error("Expected single row, got " + rows.length);
    return rows[0];
  }
  if (maybeSingle) return rows[0] || null;
  if (count) return { rows, count: rows.length };
  return rows;
}

// ---------- Generic INSERT / UPSERT ----------
function runInsert({ table, rows, returning = true, upsert = false, onConflict }) {
  const db = getDb();
  const real = resolveTable(table);
  const list = Array.isArray(rows) ? rows : [rows];
  if (!list.length) return [];

  // pharmacy_settings is singleton with id=1
  if (real === "pharmacy_settings") {
    const r = list[0];
    const keys = Object.keys(r);
    const updateSet = keys.map((k) => `${quoteIdent(k)} = excluded.${quoteIdent(k)}`).join(", ");
    const sql = `INSERT INTO pharmacy_settings (id, ${keys.map(quoteIdent).join(",")}) VALUES (1, ${keys.map(() => "?").join(",")}) ON CONFLICT(id) DO UPDATE SET ${updateSet}, updated_at = datetime('now')`;
    db.prepare(sql).run(...keys.map((k) => normalizeVal(r[k])));
    return [db.prepare("SELECT * FROM pharmacy_settings WHERE id = 1").get()];
  }

  const inserted = [];
  const insertOne = db.transaction((row) => {
    if (!row.id) row.id = randomUUID();
    const keys = Object.keys(row);
    const placeholders = keys.map(() => "?").join(",");
    let sql = `INSERT INTO ${quoteIdent(real)} (${keys.map(quoteIdent).join(",")}) VALUES (${placeholders})`;
    if (upsert) {
      const conflict = onConflict || "id";
      const updateSet = keys
        .filter((k) => k !== conflict)
        .map((k) => `${quoteIdent(k)} = excluded.${quoteIdent(k)}`)
        .join(", ");
      sql += ` ON CONFLICT(${quoteIdent(conflict)}) DO UPDATE SET ${updateSet}`;
    }
    db.prepare(sql).run(...keys.map((k) => normalizeVal(row[k])));
    if (returning) inserted.push(db.prepare(`SELECT * FROM ${quoteIdent(real)} WHERE id = ?`).get(row.id));
  });
  for (const row of list) insertOne(row);
  return inserted;
}

function normalizeVal(v) {
  if (v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v instanceof Date) return v.toISOString();
  if (v && typeof v === "object") return JSON.stringify(v);
  return v;
}

// ---------- Generic UPDATE ----------
function runUpdate({ table, patch, filters = [] }) {
  const db = getDb();
  const real = resolveTable(table);
  const keys = Object.keys(patch);
  if (!keys.length) return [];
  const setSql = keys.map((k) => `${quoteIdent(k)} = ?`).join(", ");
  let sql = `UPDATE ${quoteIdent(real)} SET ${setSql}`;
  const params = keys.map((k) => normalizeVal(patch[k]));
  const where = [];
  for (const f of filters) {
    if (f.op === "eq") {
      where.push(`${quoteIdent(f.col)} = ?`);
      params.push(normalizeVal(f.val));
    } else if (f.op === "in") {
      where.push(`${quoteIdent(f.col)} IN (${f.val.map(() => "?").join(",")})`);
      params.push(...f.val);
    }
  }
  if (where.length) sql += " WHERE " + where.join(" AND ");
  db.prepare(sql).run(...params);

  // Return affected
  let selSql = `SELECT * FROM ${quoteIdent(real)}`;
  if (where.length) selSql += " WHERE " + where.join(" AND ");
  return db
    .prepare(selSql)
    .all(...keys.map(() => null).slice(0, 0).concat(filters.flatMap((f) => (f.op === "in" ? f.val : [normalizeVal(f.val)]))));
}

// ---------- Generic DELETE ----------
function runDelete({ table, filters = [] }) {
  const db = getDb();
  const real = resolveTable(table);
  let sql = `DELETE FROM ${quoteIdent(real)}`;
  const params = [];
  const where = [];
  for (const f of filters) {
    if (f.op === "eq") {
      where.push(`${quoteIdent(f.col)} = ?`);
      params.push(normalizeVal(f.val));
    } else if (f.op === "in") {
      where.push(`${quoteIdent(f.col)} IN (${f.val.map(() => "?").join(",")})`);
      params.push(...f.val);
    }
  }
  if (!where.length) throw new Error("Delete requires filter");
  sql += " WHERE " + where.join(" AND ");
  return db.prepare(sql).run(...params);
}

// ---------- Business: sales, stock, alerts, accounts ----------
function nextReceiptNumber() {
  const db = getDb();
  const year = new Date().getFullYear();
  db.prepare("INSERT OR IGNORE INTO receipt_seq(year, last_value) VALUES (?, 0)").run(year);
  db.prepare("UPDATE receipt_seq SET last_value = last_value + 1 WHERE year = ?").run(year);
  const v = db.prepare("SELECT last_value FROM receipt_seq WHERE year = ?").get(year).last_value;
  return { seq: v, receipt: `REC-${year}-${String(v).padStart(6, "0")}` };
}

function writeAudit(user_id, action, entity, entity_id, details, txn_id) {
  getDb()
    .prepare(
      "INSERT INTO audit_logs (id, user_id, action, entity, entity_id, details, txn_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(randomUUID(), user_id || null, action, entity || null, entity_id || null, details ? JSON.stringify(details) : null, txn_id || null);
}

// ---------- Post-transaction integrity ----------
function assertAccountIntegrity(account_id) {
  const db = getDb();
  const acc = db.prepare("SELECT balance FROM financial_accounts WHERE id = ?").get(account_id);
  const agg = db
    .prepare(
      `SELECT COALESCE(SUM(CASE type
          WHEN 'credit' THEN amount
          WHEN 'debit'  THEN -amount
          WHEN 'reset'  THEN -amount
          ELSE 0 END), 0) AS s FROM account_movements WHERE account_id = ?`,
    )
    .get(account_id).s;
  if (Math.abs((acc?.balance ?? 0) - agg) > 0.005) {
    throw new Error(
      `Integridade violada: saldo da conta (${acc?.balance}) diverge dos movimentos (${agg}).`,
    );
  }
}
function assertBatchIntegrity(batch_id) {
  const db = getDb();
  const b = db.prepare("SELECT quantity FROM batches WHERE id = ?").get(batch_id);
  if (!b) return;
  const agg = db
    .prepare(
      `SELECT COALESCE(SUM(CASE type WHEN 'in' THEN quantity WHEN 'out' THEN -quantity WHEN 'adjust' THEN quantity ELSE 0 END), 0) AS s
       FROM stock_movements WHERE batch_id = ?`,
    )
    .get(batch_id).s;
  if (b.quantity !== agg) {
    throw new Error(
      `Integridade violada: qtd do lote (${b.quantity}) diverge dos movimentos (${agg}).`,
    );
  }
}
function assertSaleIntegrity(sale_id) {
  const db = getDb();
  const s = db.prepare("SELECT subtotal, discount, total FROM sales WHERE id = ?").get(sale_id);
  const items = db.prepare("SELECT COALESCE(SUM(total), 0) AS s FROM sale_items WHERE sale_id = ?").get(sale_id).s;
  if (Math.abs(s.subtotal - items) > 0.005) {
    throw new Error(`Integridade violada: subtotal da venda (${s.subtotal}) diverge dos itens (${items}).`);
  }
  if (Math.abs(s.total - Math.max(0, s.subtotal - (s.discount || 0))) > 0.005) {
    throw new Error(`Integridade violada: total da venda inconsistente com subtotal - desconto.`);
  }
}

function reconcile() {
  const db = getDb();
  const issues = [];
  for (const a of db.prepare("SELECT id, name, balance FROM financial_accounts").all()) {
    const agg = db
      .prepare(
        `SELECT COALESCE(SUM(CASE type WHEN 'credit' THEN amount WHEN 'debit' THEN -amount WHEN 'reset' THEN -amount ELSE 0 END),0) AS s FROM account_movements WHERE account_id = ?`,
      )
      .get(a.id).s;
    if (Math.abs(a.balance - agg) > 0.005)
      issues.push({ kind: "account", id: a.id, name: a.name, stored: a.balance, computed: agg, diff: a.balance - agg });
  }
  for (const b of db.prepare("SELECT id, product_id, batch_number, quantity FROM batches").all()) {
    const agg = db
      .prepare(
        `SELECT COALESCE(SUM(CASE type WHEN 'in' THEN quantity WHEN 'out' THEN -quantity WHEN 'adjust' THEN quantity ELSE 0 END),0) AS s FROM stock_movements WHERE batch_id = ?`,
      )
      .get(b.id).s;
    if (b.quantity !== agg)
      issues.push({ kind: "batch", id: b.id, batch_number: b.batch_number, stored: b.quantity, computed: agg, diff: b.quantity - agg });
  }
  for (const s of db.prepare("SELECT id, receipt_number, subtotal, discount, total FROM sales").all()) {
    const items = db.prepare("SELECT COALESCE(SUM(total),0) AS s FROM sale_items WHERE sale_id = ?").get(s.id).s;
    if (Math.abs(s.subtotal - items) > 0.005)
      issues.push({ kind: "sale.subtotal", id: s.id, receipt: s.receipt_number, stored: s.subtotal, computed: items });
    if (Math.abs(s.total - Math.max(0, s.subtotal - (s.discount || 0))) > 0.005)
      issues.push({ kind: "sale.total", id: s.id, receipt: s.receipt_number, stored: s.total });
  }
  return { checked_at: new Date().toISOString(), ok: issues.length === 0, issues };
}

function txnDetail({ txn_id }) {
  if (!txn_id) throw new Error("txn_id obrigatório");
  const db = getDb();
  const sale = db
    .prepare(
      `SELECT s.*, u.full_name AS user_name, fa.name AS account_name
       FROM sales s
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN financial_accounts fa ON fa.id = s.account_id
       WHERE s.txn_id = ? LIMIT 1`,
    )
    .get(txn_id);
  const items = db
    .prepare(
      `SELECT si.*, b.batch_number, b.expiry_date
       FROM sale_items si LEFT JOIN batches b ON b.id = si.batch_id
       WHERE si.txn_id = ?`,
    )
    .all(txn_id);
  const movements = db
    .prepare(
      `SELECT sm.*, p.name AS product_name, b.batch_number
       FROM stock_movements sm
       LEFT JOIN products p ON p.id = sm.product_id
       LEFT JOIN batches b ON b.id = sm.batch_id
       WHERE sm.txn_id = ? ORDER BY sm.created_at`,
    )
    .all(txn_id);
  const accountMoves = db
    .prepare(
      `SELECT am.*, fa.name AS account_name
       FROM account_movements am LEFT JOIN financial_accounts fa ON fa.id = am.account_id
       WHERE am.txn_id = ? ORDER BY am.created_at`,
    )
    .all(txn_id);
  const batchesCreated = db
    .prepare(
      `SELECT b.*, p.name AS product_name, sup.legal_name AS supplier_name
       FROM batches b
       LEFT JOIN products p ON p.id = b.product_id
       LEFT JOIN suppliers sup ON sup.id = b.supplier_id
       WHERE b.txn_id = ?`,
    )
    .all(txn_id);
  const logs = db
    .prepare(
      `SELECT al.*, u.full_name AS user_name FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.txn_id = ? ORDER BY al.created_at`,
    )
    .all(txn_id);
  return { txn_id, sale, items, movements, account_movements: accountMoves, batches: batchesCreated, logs };
}

function auditExport({ from, to, entity, action, only_divergent } = {}) {
  const db = getDb();
  const where = [];
  const params = [];
  if (from) { where.push("al.created_at >= ?"); params.push(from); }
  if (to) { where.push("al.created_at <= ?"); params.push(to); }
  if (entity) { where.push("al.entity = ?"); params.push(entity); }
  if (action) { where.push("al.action = ?"); params.push(action); }
  const sql = `SELECT al.id, al.created_at, al.entity, al.action, al.entity_id, al.txn_id, al.details, u.full_name AS user_name
               FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
               ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY al.created_at DESC LIMIT 10000`;
  let rows = db.prepare(sql).all(...params);
  if (only_divergent) {
    const rec = reconcile();
    const bad = new Set(rec.issues.map((i) => String(i.id)));
    rows = rows.filter((r) => r.entity_id && bad.has(String(r.entity_id)));
  }
  return rows;
}

function processSale({ customer_id, payment_method, discount = 0, items, account_id }) {
  const db = getDb();
  const user = requireUser();
  const txn = randomUUID();

  return db.transaction(() => {
    const session = db
      .prepare("SELECT id FROM cash_sessions WHERE user_id = ? AND status = 'open' LIMIT 1")
      .get(user.id);
    if (!session) throw new Error("Abra um turno de caixa antes de registar vendas");

    let acc = account_id;
    if (!acc) {
      const sysAcc = db
        .prepare("SELECT id FROM financial_accounts WHERE is_system = 1 AND name = 'Caixa' LIMIT 1")
        .get();
      if (!sysAcc) throw new Error("Conta de destino não definida");
      acc = sysAcc.id;
    }

    let subtotal = 0;
    for (const it of items) subtotal += it.quantity * it.unit_price;
    const total = Math.max(0, subtotal - (discount || 0));
    const { seq, receipt } = nextReceiptNumber();
    const saleId = randomUUID();

    db.prepare(
      `INSERT INTO sales (id, sale_number, receipt_number, customer_id, user_id, cash_session_id, account_id, subtotal, discount, total, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
    ).run(saleId, seq, receipt, customer_id || null, user.id, session.id, acc, subtotal, discount || 0, total, payment_method);

    const touchedBatches = new Set();
    let itemsTotal = 0;

    for (const it of items) {
      const product = db.prepare("SELECT * FROM products WHERE id = ?").get(it.product_id);
      if (!product) throw new Error("Produto não encontrado");
      const pack = Math.max(1, product.pack_size);
      const unitKind = it.unit_kind || "pack";
      const qtyDisplay = it.quantity;
      const unitPrice = it.unit_price;
      const unitLabel = unitKind === "sub" ? product.sub_unit_label || "unidade" : product.unit || "cx";
      const qtyUnits = unitKind === "sub" ? qtyDisplay : qtyDisplay * pack;

      const today = new Date().toISOString().slice(0, 10);
      const avail = db
        .prepare(
          "SELECT COALESCE(SUM(quantity), 0) AS s FROM batches WHERE product_id = ? AND quantity > 0 AND expiry_date >= ?",
        )
        .get(it.product_id, today).s;
      if (avail < qtyUnits) {
        throw new Error(
          `Estoque insuficiente para ${product.name} (disponível: ${avail}, necessário: ${qtyUnits})`,
        );
      }

      const batches = db
        .prepare(
          `SELECT * FROM batches WHERE product_id = ? AND quantity > 0 AND expiry_date >= ?
           ORDER BY
             CASE WHEN ? = 'sub' AND ? > 1 AND (quantity % ?) <> 0 THEN 0 ELSE 1 END,
             expiry_date ASC, created_at ASC`,
        )
        .all(it.product_id, today, unitKind, pack, pack);

      let remaining = qtyUnits;
      for (const b of batches) {
        if (remaining <= 0) break;
        const take = Math.min(b.quantity, remaining);
        db.prepare("UPDATE batches SET quantity = quantity - ? WHERE id = ?").run(take, b.id);

        const dispQty = unitKind === "sub" ? take : Math.ceil(take / pack);
        const lineTotal = dispQty * unitPrice;
        itemsTotal += lineTotal;
        db.prepare(
          `INSERT INTO sale_items (id, sale_id, product_id, batch_id, product_name, quantity, unit_price, total, unit_kind, unit_label, txn_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(randomUUID(), saleId, it.product_id, b.id, product.name, dispQty, unitPrice, lineTotal, unitKind, unitLabel, txn);

        db.prepare(
          `INSERT INTO stock_movements (id, batch_id, product_id, type, quantity, reason, user_id, reference_id, txn_id)
           VALUES (?, ?, ?, 'out', ?, 'Venda', ?, ?, ?)`,
        ).run(randomUUID(), b.id, it.product_id, take, user.id, saleId, txn);

        touchedBatches.add(b.id);
        remaining -= take;
      }
    }

    // Reconcile subtotal to what really was billed line-by-line (FEFO rounding)
    db.prepare("UPDATE sales SET subtotal = ?, total = ? WHERE id = ?").run(
      itemsTotal,
      Math.max(0, itemsTotal - (discount || 0)),
      saleId,
    );
    const finalTotal = Math.max(0, itemsTotal - (discount || 0));

    db.prepare(
      `INSERT INTO account_movements (id, account_id, type, amount, reason, sale_id, user_id, txn_id)
       VALUES (?, ?, 'credit', ?, ?, ?, ?, ?)`,
    ).run(randomUUID(), acc, finalTotal, "Venda " + receipt, saleId, user.id, txn);
    db.prepare("UPDATE financial_accounts SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?").run(
      finalTotal,
      acc,
    );

    writeAudit(user.id, "sale.completed", "sales", saleId,
      { txn, receipt, total: finalTotal, payment_method, account_id: acc, items_count: items.length }, txn);

    // Post-transaction integrity assertions — abort txn if any drift
    assertSaleIntegrity(saleId);
    assertAccountIntegrity(acc);
    for (const bId of touchedBatches) assertBatchIntegrity(bId);

    refreshAlerts();
    return { sale_id: saleId, txn_id: txn, receipt };
  })();
}

function addBatchEntry({ product_id, supplier_id, batch_number, expiry_date, quantity, cost_price }) {
  const db = getDb();
  const user = requireStaff();
  if (new Date(expiry_date) < new Date(new Date().toISOString().slice(0, 10))) throw new Error("Validade no passado");
  const txn = randomUUID();
  return db.transaction(() => {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO batches (id, product_id, supplier_id, batch_number, expiry_date, quantity, cost_price, txn_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, product_id, supplier_id || null, batch_number, expiry_date, quantity, cost_price || 0, txn);
    db.prepare(
      `INSERT INTO stock_movements (id, batch_id, product_id, type, quantity, reason, user_id, txn_id)
       VALUES (?, ?, ?, 'in', ?, 'Entrada de estoque', ?, ?)`,
    ).run(randomUUID(), id, product_id, quantity, user.id, txn);
    writeAudit(user.id, "stock.entry", "batches", id,
      { txn, product_id, supplier_id, batch_number, quantity, expiry_date }, txn);
    assertBatchIntegrity(id);
    refreshAlerts();
    return { batch_id: id, txn_id: txn };
  })();
}

function refreshAlerts() {
  const db = getDb();
  db.prepare("DELETE FROM alerts WHERE resolved = 0").run();
  const today = new Date().toISOString().slice(0, 10);

  const products = db
    .prepare(
      `SELECT p.id, p.name, p.min_stock,
        COALESCE((SELECT SUM(quantity) FROM batches b WHERE b.product_id = p.id AND b.expiry_date >= ?), 0) AS total_qty
       FROM products p WHERE p.active = 1`,
    )
    .all(today);
  for (const r of products) {
    if (r.total_qty === 0) {
      db.prepare(
        `INSERT INTO alerts (id, type, severity, product_id, message) VALUES (?, 'low_stock', 'critical', ?, ?)`,
      ).run(randomUUID(), r.id, `${r.name} está sem estoque`);
    } else if (r.total_qty <= Math.max(1, r.min_stock * 0.5)) {
      db.prepare(
        `INSERT INTO alerts (id, type, severity, product_id, message) VALUES (?, 'low_stock', 'critical', ?, ?)`,
      ).run(randomUUID(), r.id, `${r.name} com estoque crítico (${r.total_qty} un, mín ${r.min_stock})`);
    } else if (r.total_qty <= r.min_stock) {
      db.prepare(
        `INSERT INTO alerts (id, type, severity, product_id, message) VALUES (?, 'low_stock', 'warning', ?, ?)`,
      ).run(randomUUID(), r.id, `${r.name} abaixo do mínimo (${r.total_qty}/${r.min_stock})`);
    }
  }

  const batches = db
    .prepare(
      `SELECT b.id, b.product_id, b.batch_number, b.expiry_date, p.name,
        CAST(julianday(b.expiry_date) - julianday(?) AS INTEGER) AS days_left,
        COALESCE(p.expiry_alert_days, 60) AS alert_days
       FROM batches b JOIN products p ON p.id = b.product_id WHERE b.quantity > 0`,
    )
    .all(today);
  for (const r of batches) {
    if (r.days_left < 0) {
      db.prepare(
        `INSERT INTO alerts (id, type, severity, product_id, batch_id, message) VALUES (?, 'expired', 'critical', ?, ?, ?)`,
      ).run(
        randomUUID(),
        r.product_id,
        r.id,
        `${r.name} lote ${r.batch_number} VENCIDO há ${Math.abs(r.days_left)} dias`,
      );
    } else if (r.days_left === 0) {
      db.prepare(
        `INSERT INTO alerts (id, type, severity, product_id, batch_id, message) VALUES (?, 'near_expiry', 'critical', ?, ?, ?)`,
      ).run(randomUUID(), r.product_id, r.id, `${r.name} lote ${r.batch_number} vence HOJE`);
    } else if (r.days_left <= Math.max(1, Math.floor(r.alert_days / 3))) {
      db.prepare(
        `INSERT INTO alerts (id, type, severity, product_id, batch_id, message) VALUES (?, 'near_expiry', 'critical', ?, ?, ?)`,
      ).run(randomUUID(), r.product_id, r.id, `${r.name} lote ${r.batch_number} vence em ${r.days_left} dias`);
    } else if (r.days_left <= r.alert_days) {
      db.prepare(
        `INSERT INTO alerts (id, type, severity, product_id, batch_id, message) VALUES (?, 'near_expiry', 'warning', ?, ?, ?)`,
      ).run(randomUUID(), r.product_id, r.id, `${r.name} lote ${r.batch_number} vence em ${r.days_left} dias`);
    }
  }
}

function openCashSession({ opening }) {
  const db = getDb();
  const user = requireUser();
  const existing = db
    .prepare("SELECT id FROM cash_sessions WHERE user_id = ? AND status = 'open'")
    .get(user.id);
  if (existing) throw new Error("Já existe um turno aberto");
  const id = randomUUID();
  db.prepare(
    "INSERT INTO cash_sessions (id, user_id, opening_amount) VALUES (?, ?, ?)",
  ).run(id, user.id, opening || 0);
  return id;
}

function closeCashSession({ counted, notes }) {
  const db = getDb();
  const user = requireUser();
  const session = db
    .prepare("SELECT * FROM cash_sessions WHERE user_id = ? AND status = 'open'")
    .get(user.id);
  if (!session) throw new Error("Sem turno aberto");
  const cashSales = db
    .prepare(
      "SELECT COALESCE(SUM(total), 0) AS s FROM sales WHERE cash_session_id = ? AND payment_method = 'cash' AND status = 'completed'",
    )
    .get(session.id).s;
  const expected = session.opening_amount + cashSales;
  db.prepare(
    `UPDATE cash_sessions SET status = 'closed', closed_at = datetime('now'),
      counted_amount = ?, expected_amount = ?, difference = ?, notes = ? WHERE id = ?`,
  ).run(counted || 0, expected, (counted || 0) - expected, notes || null, session.id);
  return session.id;
}

function adjustAccount({ account_id, type, amount, reason }) {
  const db = getDb();
  const user = requireAdmin();
  if (!["credit", "debit", "reset"].includes(type)) throw new Error("Tipo inválido");
  const acc = db.prepare("SELECT * FROM financial_accounts WHERE id = ?").get(account_id);
  if (!acc) throw new Error("Conta não encontrada");
  const txn = randomUUID();
  return db.transaction(() => {
    const id = randomUUID();
    if (type === "reset") {
      db.prepare(
        "INSERT INTO account_movements (id, account_id, type, amount, reason, user_id, txn_id) VALUES (?, ?, 'reset', ?, ?, ?, ?)",
      ).run(id, account_id, acc.balance, reason || "Zerar conta", user.id, txn);
      db.prepare("UPDATE financial_accounts SET balance = 0, updated_at = datetime('now') WHERE id = ?").run(
        account_id,
      );
    } else {
      if (!(amount > 0)) throw new Error("Valor deve ser maior que zero");
      const delta = type === "credit" ? amount : -amount;
      db.prepare(
        "INSERT INTO account_movements (id, account_id, type, amount, reason, user_id, txn_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ).run(id, account_id, type, amount, reason || null, user.id, txn);
      db.prepare("UPDATE financial_accounts SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?").run(
        delta,
        account_id,
      );
    }
    writeAudit(user.id, "account." + type, "financial_accounts", account_id,
      { txn, amount: amount ?? acc.balance, reason }, txn);
    assertAccountIntegrity(account_id);
    return { movement_id: id, txn_id: txn };
  })();
}

function deleteAccount({ account_id }) {
  const db = getDb();
  requireAdmin();
  const acc = db.prepare("SELECT * FROM financial_accounts WHERE id = ?").get(account_id);
  if (!acc) throw new Error("Conta não encontrada");
  if (acc.is_system) throw new Error("Conta do sistema não pode ser eliminada");
  db.prepare("DELETE FROM financial_accounts WHERE id = ?").run(account_id);
}

// ---------- Admin user management ----------
function adminListUsers() {
  requireAdmin();
  return getDb()
    .prepare("SELECT id, username, full_name, email, role, active, created_at FROM users ORDER BY created_at DESC")
    .all();
}

function adminCreateUser({ username, password, full_name, email, role }) {
  requireAdmin();
  const db = getDb();
  if (!username || !password || !full_name || !role) throw new Error("Campos obrigatórios em falta");
  const hash = bcrypt.hashSync(password, 10);
  const id = randomUUID();
  db.prepare(
    "INSERT INTO users (id, username, password_hash, full_name, email, role, active) VALUES (?, ?, ?, ?, ?, ?, 1)",
  ).run(id, username, hash, full_name, email || null, role);
  return id;
}

function adminUpdateUser({ id, full_name, email, role, active, password }) {
  requireAdmin();
  const db = getDb();
  const sets = [];
  const params = [];
  if (full_name !== undefined) (sets.push("full_name = ?"), params.push(full_name));
  if (email !== undefined) (sets.push("email = ?"), params.push(email));
  if (role !== undefined) (sets.push("role = ?"), params.push(role));
  if (active !== undefined) (sets.push("active = ?"), params.push(active ? 1 : 0));
  if (password) (sets.push("password_hash = ?"), params.push(bcrypt.hashSync(password, 10)));
  if (!sets.length) return;
  sets.push("updated_at = datetime('now')");
  params.push(id);
  db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...params);
}

function adminDeleteUser({ id }) {
  requireAdmin();
  if (SESSION.user && SESSION.user.id === id) throw new Error("Não pode eliminar a sua própria conta");
  getDb().prepare("DELETE FROM users WHERE id = ?").run(id);
}

function changeOwnPassword({ current, next }) {
  const u = requireUser();
  const db = getDb();
  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(u.id);
  if (!bcrypt.compareSync(current, row.password_hash)) throw new Error("Palavra-passe actual inválida");
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(
    bcrypt.hashSync(next, 10),
    u.id,
  );
}

module.exports = {
  authSignIn,
  authSignOut,
  authGetUser,
  runSelect,
  runInsert,
  runUpdate,
  runDelete,
  processSale,
  addBatchEntry,
  refreshAlerts,
  openCashSession,
  closeCashSession,
  adjustAccount,
  deleteAccount,
  adminListUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  changeOwnPassword,
  reconcile,
};
