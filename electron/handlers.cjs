const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

function uuid() { return crypto.randomUUID(); }
function nowIso() { return new Date().toISOString(); }
const ALLOWED_TABLES = new Set([
  "profiles","user_roles","categories","suppliers","customers","products","batches",
  "cash_sessions","sales","sale_items","stock_movements","alerts","audit_logs","pharmacy_settings",
]);

function buildWhere(filters) {
  if (!filters || !filters.length) return { sql: "", params: [] };
  const params = [];
  const parts = filters.map((f) => clauseFor(f, params)).filter(Boolean);
  if (!parts.length) return { sql: "", params };
  return { sql: " WHERE " + parts.join(" AND "), params };
}

function clauseFor(f, params) {
  const col = sanCol(f.col);
  switch (f.op) {
    case "eq":  if (f.val === null) return `${col} IS NULL`; params.push(f.val); return `${col} = ?`;
    case "neq": if (f.val === null) return `${col} IS NOT NULL`; params.push(f.val); return `${col} <> ?`;
    case "gt":  params.push(f.val); return `${col} > ?`;
    case "gte": params.push(f.val); return `${col} >= ?`;
    case "lt":  params.push(f.val); return `${col} < ?`;
    case "lte": params.push(f.val); return `${col} <= ?`;
    case "is":  return `${col} IS ${f.val === null ? "NULL" : "NOT NULL"}`;
    case "ilike": params.push(String(f.val)); return `${col} LIKE ? COLLATE NOCASE`;
    case "like":  params.push(String(f.val)); return `${col} LIKE ?`;
    case "in": {
      if (!Array.isArray(f.val) || f.val.length === 0) return "0=1";
      f.val.forEach((v) => params.push(v));
      return `${col} IN (${f.val.map(() => "?").join(",")})`;
    }
    case "or": {
      // f.val is a string like "name.ilike.%abc%,barcode.ilike.%abc%"
      const subs = parseOrString(String(f.val));
      if (!subs.length) return "";
      const cls = subs.map((s) => clauseFor(s, params)).filter(Boolean);
      return cls.length ? `(${cls.join(" OR ")})` : "";
    }
    default: return "";
  }
}

function parseOrString(s) {
  // Split top-level commas (no nested parens used by app)
  const parts = s.split(",");
  return parts.map((p) => {
    const m = p.match(/^([\w_]+)\.(eq|neq|gt|gte|lt|lte|ilike|like|is|in)\.(.*)$/);
    if (!m) return null;
    return { col: m[1], op: m[2], val: m[3] };
  }).filter(Boolean);
}

function sanCol(c) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(c)) throw new Error("Invalid column: " + c);
  return c;
}
function sanTable(t) {
  if (!ALLOWED_TABLES.has(t)) throw new Error("Unknown table: " + t);
  return t;
}

// Parse "id, name, batches(id, expiry_date, quantity, suppliers(legal_name))" → tree
function parseSelect(sel) {
  if (!sel || sel === "*") return { cols: ["*"], joins: [] };
  const cols = [];
  const joins = [];
  let i = 0;
  while (i < sel.length) {
    // skip spaces/commas
    while (i < sel.length && /[\s,]/.test(sel[i])) i++;
    if (i >= sel.length) break;
    let j = i;
    while (j < sel.length && /[\w_:]/.test(sel[j])) j++;
    const name = sel.slice(i, j);
    if (sel[j] === "(") {
      // nested
      let depth = 1; let k = j + 1;
      while (k < sel.length && depth > 0) {
        if (sel[k] === "(") depth++;
        else if (sel[k] === ")") depth--;
        if (depth) k++;
      }
      const inner = sel.slice(j + 1, k);
      joins.push({ name, sub: parseSelect(inner) });
      i = k + 1;
    } else {
      cols.push(name);
      i = j;
    }
  }
  if (!cols.length) cols.push("*");
  return { cols, joins };
}

// FK metadata for nested selects (table => { childAlias: { table, fk } })
const NESTED = {
  products: {
    batches: { table: "batches", fk: "product_id", localKey: "id", many: true },
    categories: { table: "categories", fk: "id", localKey: "category_id", many: false },
  },
  batches: {
    suppliers: { table: "suppliers", fk: "id", localKey: "supplier_id", many: false },
    products: { table: "products", fk: "id", localKey: "product_id", many: false },
  },
  sales: {
    sale_items: { table: "sale_items", fk: "sale_id", localKey: "id", many: true },
    customers: { table: "customers", fk: "id", localKey: "customer_id", many: false },
    profiles: { table: "profiles", fk: "id", localKey: "user_id", many: false },
    cash_sessions: { table: "cash_sessions", fk: "id", localKey: "cash_session_id", many: false },
  },
  sale_items: {
    products: { table: "products", fk: "id", localKey: "product_id", many: false },
    batches: { table: "batches", fk: "id", localKey: "batch_id", many: false },
  },
  cash_sessions: {
    profiles: { table: "profiles", fk: "id", localKey: "user_id", many: false },
  },
  user_roles: {
    profiles: { table: "profiles", fk: "id", localKey: "user_id", many: false },
  },
  alerts: {
    products: { table: "products", fk: "id", localKey: "product_id", many: false },
    batches: { table: "batches", fk: "id", localKey: "batch_id", many: false },
  },
  stock_movements: {
    products: { table: "products", fk: "id", localKey: "product_id", many: false },
    batches: { table: "batches", fk: "id", localKey: "batch_id", many: false },
  },
  audit_logs: {
    profiles: { table: "profiles", fk: "id", localKey: "user_id", many: false },
  },
};

function colListFor(table, cols) {
  if (cols.length === 1 && cols[0] === "*") return "*";
  // Always include id when joins exist? We add localKey columns lazily by re-running with star
  // For safety, return * and project later
  return "*";
}

function runQuery(db, q) {
  const table = sanTable(q.table);
  const tree = parseSelect(q.select || "*");
  const { sql: whereSql, params } = buildWhere(q.filters || []);
  let sql = `SELECT * FROM ${table}${whereSql}`;
  if (q.order && q.order.length) {
    const parts = q.order.map((o) => `${sanCol(o.col)} ${o.asc === false ? "DESC" : "ASC"}`);
    sql += ` ORDER BY ${parts.join(", ")}`;
  }
  if (q.limit) sql += ` LIMIT ${Number(q.limit)}`;
  let rows = db.prepare(sql).all(...params);
  rows = rows.map((r) => normalizeRow(r));

  // Expand nested joins
  if (tree.joins.length) {
    for (const join of tree.joins) {
      const meta = (NESTED[table] || {})[join.name];
      if (!meta) continue; // unknown, skip
      const keyVals = rows.map((r) => r[meta.localKey]).filter((v) => v != null);
      if (keyVals.length === 0) {
        rows.forEach((r) => { r[join.name] = meta.many ? [] : null; });
        continue;
      }
      const childSql = `SELECT * FROM ${meta.table} WHERE ${meta.fk} IN (${keyVals.map(() => "?").join(",")})`;
      const childRows = db.prepare(childSql).all(...keyVals).map(normalizeRow);
      // Recurse for sub-joins
      if (join.sub.joins.length) {
        expandChildren(db, meta.table, childRows, join.sub.joins);
      }
      // Project columns on children
      const projected = join.sub.cols[0] === "*" ? childRows : childRows.map((cr) => pickCols(cr, join.sub.cols, join.sub.joins.map((j) => j.name)));
      // Attach
      if (meta.many) {
        const grouped = new Map();
        for (const cr of projected) {
          const k = cr[meta.fk] ?? childRows.find((x) => x.id === cr.id)?.[meta.fk];
          if (!grouped.has(k)) grouped.set(k, []);
          grouped.get(k).push(cr);
        }
        rows.forEach((r) => { r[join.name] = grouped.get(r[meta.localKey]) || []; });
      } else {
        const byId = new Map(projected.map((cr) => [cr[meta.fk], cr]));
        rows.forEach((r) => { r[join.name] = byId.get(r[meta.localKey]) || null; });
      }
    }
  }

  // Project top-level columns
  if (tree.cols[0] !== "*") {
    rows = rows.map((r) => pickCols(r, tree.cols, tree.joins.map((j) => j.name)));
  }
  return rows;
}

function expandChildren(db, table, rows, joins) {
  for (const join of joins) {
    const meta = (NESTED[table] || {})[join.name];
    if (!meta) continue;
    const keyVals = rows.map((r) => r[meta.localKey]).filter((v) => v != null);
    if (keyVals.length === 0) {
      rows.forEach((r) => { r[join.name] = meta.many ? [] : null; });
      continue;
    }
    const childRows = db.prepare(`SELECT * FROM ${meta.table} WHERE ${meta.fk} IN (${keyVals.map(() => "?").join(",")})`).all(...keyVals).map(normalizeRow);
    if (join.sub.joins.length) expandChildren(db, meta.table, childRows, join.sub.joins);
    const projected = join.sub.cols[0] === "*" ? childRows : childRows.map((cr) => pickCols(cr, join.sub.cols, join.sub.joins.map((j) => j.name)));
    if (meta.many) {
      const grouped = new Map();
      for (const cr of projected) {
        const k = cr[meta.fk];
        if (!grouped.has(k)) grouped.set(k, []);
        grouped.get(k).push(cr);
      }
      rows.forEach((r) => { r[join.name] = grouped.get(r[meta.localKey]) || []; });
    } else {
      const byId = new Map(projected.map((cr) => [cr[meta.fk], cr]));
      rows.forEach((r) => { r[join.name] = byId.get(r[meta.localKey]) || null; });
    }
  }
}

function pickCols(row, cols, alwaysKeep = []) {
  const out = {};
  for (const c of cols) { if (c in row) out[c] = row[c]; }
  for (const k of alwaysKeep) if (k in row) out[k] = row[k];
  return out;
}

function normalizeRow(r) {
  // Convert integer booleans to real booleans for known boolean cols
  const BOOL_COLS = new Set(["active","requires_prescription","read","resolved","show_pharmacist"]);
  const out = {};
  for (const k of Object.keys(r)) {
    if (BOOL_COLS.has(k) && (r[k] === 0 || r[k] === 1)) out[k] = !!r[k];
    else out[k] = r[k];
  }
  return out;
}

function doInsert(db, table, values) {
  table = sanTable(table);
  const arr = Array.isArray(values) ? values : [values];
  const inserted = [];
  const tx = db.transaction((rows) => {
    for (const v of rows) {
      const row = { id: v.id || uuid(), ...v };
      // Normalize booleans for SQLite
      for (const k of Object.keys(row)) if (typeof row[k] === "boolean") row[k] = row[k] ? 1 : 0;
      const cols = Object.keys(row);
      const sql = `INSERT INTO ${table} (${cols.map(sanCol).join(",")}) VALUES (${cols.map(() => "?").join(",")})`;
      db.prepare(sql).run(...cols.map((c) => row[c]));
      inserted.push(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(row.id));
    }
  });
  tx(arr);
  return inserted.map(normalizeRow);
}

function doUpdate(db, table, patch, filters) {
  table = sanTable(table);
  const cols = Object.keys(patch);
  if (!cols.length) return [];
  for (const k of cols) if (typeof patch[k] === "boolean") patch[k] = patch[k] ? 1 : 0;
  const setSql = cols.map((c) => `${sanCol(c)} = ?`).join(", ");
  const { sql: whereSql, params } = buildWhere(filters || []);
  const setParams = cols.map((c) => patch[c]);
  // Touch updated_at if column exists
  const hasUpdated = db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === "updated_at");
  const finalSet = hasUpdated ? setSql + ", updated_at = datetime('now')" : setSql;
  db.prepare(`UPDATE ${table} SET ${finalSet}${whereSql}`).run(...setParams, ...params);
  // Return updated rows
  return db.prepare(`SELECT * FROM ${table}${whereSql}`).all(...params).map(normalizeRow);
}

function doDelete(db, table, filters) {
  table = sanTable(table);
  const { sql: whereSql, params } = buildWhere(filters || []);
  if (!whereSql) throw new Error("delete sem filtro bloqueado");
  const rows = db.prepare(`SELECT * FROM ${table}${whereSql}`).all(...params).map(normalizeRow);
  db.prepare(`DELETE FROM ${table}${whereSql}`).run(...params);
  return rows;
}

// ===================== RPCs =====================
function rpc_add_batch_entry(db, args, ctx) {
  if (!ctx.userId) throw new Error("Não autenticado");
  if (!isStaff(db, ctx.userId)) throw new Error("Permissão negada");
  const id = uuid();
  db.transaction(() => {
    db.prepare(`INSERT INTO batches(id, product_id, supplier_id, batch_number, expiry_date, quantity, cost_price)
      VALUES (?,?,?,?,?,?,?)`).run(id, args.p_product_id, args.p_supplier_id || null, args.p_batch_number, args.p_expiry_date, args.p_quantity, args.p_cost_price);
    db.prepare(`INSERT INTO stock_movements(id, batch_id, product_id, type, quantity, reason, user_id)
      VALUES (?,?,?,?,?,?,?)`).run(uuid(), id, args.p_product_id, "in", args.p_quantity, "Entrada de estoque", ctx.userId);
  })();
  return id;
}

function rpc_open_cash_session(db, args, ctx) {
  if (!ctx.userId) throw new Error("Não autenticado");
  const existing = db.prepare(`SELECT id FROM cash_sessions WHERE user_id=? AND status='open'`).get(ctx.userId);
  if (existing) throw new Error("Já existe um turno aberto");
  const id = uuid();
  db.prepare(`INSERT INTO cash_sessions(id, user_id, opening_amount) VALUES (?,?,?)`).run(id, ctx.userId, args.p_opening || 0);
  return id;
}

function rpc_close_cash_session(db, args, ctx) {
  if (!ctx.userId) throw new Error("Não autenticado");
  const s = db.prepare(`SELECT * FROM cash_sessions WHERE user_id=? AND status='open'`).get(ctx.userId);
  if (!s) throw new Error("Sem turno aberto");
  const sum = db.prepare(`SELECT COALESCE(SUM(total),0) AS s FROM sales WHERE cash_session_id=? AND payment_method='cash' AND status='completed'`).get(s.id).s;
  const expected = (s.opening_amount || 0) + sum;
  const counted = args.p_counted || 0;
  db.prepare(`UPDATE cash_sessions SET status='closed', closed_at=datetime('now'), counted_amount=?, expected_amount=?, difference=?, notes=?, updated_at=datetime('now') WHERE id=?`)
    .run(counted, expected, counted - expected, args.p_notes || null, s.id);
  return s.id;
}

function rpc_process_sale(db, args, ctx) {
  if (!ctx.userId) throw new Error("Não autenticado");
  const session = db.prepare(`SELECT id FROM cash_sessions WHERE user_id=? AND status='open'`).get(ctx.userId);
  if (!session) throw new Error("Abra um turno de caixa antes de registar vendas");
  const items = args.p_items || [];
  let subtotal = 0;
  for (const it of items) subtotal += Number(it.quantity) * Number(it.unit_price);
  const total = Math.max(0, subtotal - (args.p_discount || 0));
  const saleId = uuid();
  const year = new Date().getFullYear().toString();
  let receipt;
  db.transaction(() => {
    db.prepare(`INSERT OR IGNORE INTO sales_receipt_seq(year, n) VALUES (?, 0)`).run(year);
    db.prepare(`UPDATE sales_receipt_seq SET n = n + 1 WHERE year = ?`).run(year);
    const n = db.prepare(`SELECT n FROM sales_receipt_seq WHERE year=?`).get(year).n;
    receipt = `REC-${year}-${String(n).padStart(6, "0")}`;
    db.prepare(`INSERT INTO sales(id, customer_id, user_id, subtotal, discount, total, payment_method, status, receipt_number, cash_session_id)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(saleId, args.p_customer_id || null, ctx.userId, subtotal, args.p_discount || 0, total, args.p_payment_method, "completed", receipt, session.id);

    const today = new Date().toISOString().slice(0, 10);
    for (const it of items) {
      const product = db.prepare(`SELECT * FROM products WHERE id=?`).get(it.product_id);
      if (!product) throw new Error("Produto não encontrado");
      const unitKind = it.unit_kind || "pack";
      const qtyDisplay = Number(it.quantity);
      const unitPrice = Number(it.unit_price);
      let qtyUnits, unitLabel;
      if (unitKind === "sub") { qtyUnits = qtyDisplay; unitLabel = product.sub_unit_label || "unidade"; }
      else { qtyUnits = qtyDisplay * Math.max(1, product.pack_size); unitLabel = product.unit || "cx"; }

      let remaining = qtyUnits;
      const batches = db.prepare(`SELECT * FROM batches WHERE product_id=? AND quantity>0 AND expiry_date>=? ORDER BY expiry_date ASC`).all(it.product_id, today);
      for (const b of batches) {
        if (remaining <= 0) break;
        const take = Math.min(b.quantity, remaining);
        db.prepare(`UPDATE batches SET quantity = quantity - ?, updated_at = datetime('now') WHERE id=?`).run(take, b.id);
        const qty = unitKind === "sub" ? take : Math.ceil(take / Math.max(1, product.pack_size));
        const lineTotal = qty * unitPrice;
        db.prepare(`INSERT INTO sale_items(id, sale_id, product_id, batch_id, product_name, quantity, unit_price, total, unit_kind, unit_label)
          VALUES (?,?,?,?,?,?,?,?,?,?)`).run(uuid(), saleId, product.id, b.id, product.name, qty, unitPrice, lineTotal, unitKind, unitLabel);
        db.prepare(`INSERT INTO stock_movements(id, batch_id, product_id, type, quantity, reason, user_id, reference_id)
          VALUES (?,?,?,?,?,?,?,?)`).run(uuid(), b.id, product.id, "out", take, "Venda", ctx.userId, saleId);
        remaining -= take;
      }
      if (remaining > 0) throw new Error(`Estoque insuficiente para ${product.name}`);
    }
  })();
  return saleId;
}

function rpc_refresh_alerts(db) {
  db.prepare(`DELETE FROM alerts WHERE resolved = 0`).run();
  const today = new Date().toISOString().slice(0, 10);
  const products = db.prepare(`SELECT p.id, p.name, p.min_stock, COALESCE(SUM(b.quantity),0) AS qty
    FROM products p LEFT JOIN batches b ON b.product_id=p.id AND b.expiry_date>=?
    WHERE p.active=1 GROUP BY p.id`).all(today);
  const insAlert = db.prepare(`INSERT INTO alerts(id, type, severity, product_id, batch_id, message) VALUES (?,?,?,?,?,?)`);
  for (const r of products) {
    if (r.qty === 0) insAlert.run(uuid(), "low_stock", "critical", r.id, null, `${r.name} está sem estoque`);
    else if (r.qty <= r.min_stock * 0.5) insAlert.run(uuid(), "low_stock", "warning", r.id, null, `${r.name} com estoque crítico (${r.qty} un)`);
    else if (r.qty <= r.min_stock) insAlert.run(uuid(), "low_stock", "info", r.id, null, `${r.name} próximo do mínimo (${r.qty} un)`);
  }
  const batches = db.prepare(`SELECT b.id, b.product_id, b.batch_number, b.expiry_date, p.name,
    CAST(julianday(b.expiry_date) - julianday('now') AS INTEGER) AS days_left
    FROM batches b JOIN products p ON p.id=b.product_id WHERE b.quantity>0`).all();
  for (const r of batches) {
    if (r.days_left < 0) insAlert.run(uuid(), "expired", "critical", r.product_id, r.id, `${r.name} lote ${r.batch_number} VENCIDO`);
    else if (r.days_left <= 30) insAlert.run(uuid(), "near_expiry", "critical", r.product_id, r.id, `${r.name} lote ${r.batch_number} vence em ${r.days_left} dias`);
    else if (r.days_left <= 60) insAlert.run(uuid(), "near_expiry", "warning", r.product_id, r.id, `${r.name} lote ${r.batch_number} vence em ${r.days_left} dias`);
    else if (r.days_left <= 90) insAlert.run(uuid(), "near_expiry", "info", r.product_id, r.id, `${r.name} lote ${r.batch_number} vence em ${r.days_left} dias`);
  }
  return null;
}

function rpc_admin_set_user_role(db, args, ctx) {
  if (!isAdmin(db, ctx.userId)) throw new Error("Permissão negada");
  db.transaction(() => {
    db.prepare(`DELETE FROM user_roles WHERE user_id=?`).run(args.p_user_id);
    db.prepare(`INSERT INTO user_roles(id, user_id, role) VALUES (?,?,?)`).run(uuid(), args.p_user_id, args.p_role);
  })();
  return null;
}

function rpc_admin_set_user_active(db, args, ctx) {
  if (!isAdmin(db, ctx.userId)) throw new Error("Permissão negada");
  db.prepare(`UPDATE profiles SET active=?, updated_at=datetime('now') WHERE id=?`).run(args.p_active ? 1 : 0, args.p_user_id);
  return null;
}

function isAdmin(db, uid) {
  if (!uid) return false;
  return !!db.prepare(`SELECT 1 FROM user_roles WHERE user_id=? AND role='admin'`).get(uid);
}
function isStaff(db, uid) {
  if (!uid) return false;
  return !!db.prepare(`SELECT 1 FROM user_roles WHERE user_id=? AND role IN ('admin','pharmacist')`).get(uid);
}

const RPCS = {
  add_batch_entry: rpc_add_batch_entry,
  open_cash_session: rpc_open_cash_session,
  close_cash_session: rpc_close_cash_session,
  process_sale: rpc_process_sale,
  refresh_alerts: rpc_refresh_alerts,
  admin_set_user_role: rpc_admin_set_user_role,
  admin_set_user_active: rpc_admin_set_user_active,
  has_role: (db, args) => isStaff(db, args._user_id) || isAdmin(db, args._user_id),
  is_admin: (db, args) => isAdmin(db, args._user_id),
};

// ===================== Session state =====================
let CURRENT_SESSION = null; // { userId, email }
const listeners = new Set();
function emitAuth(win) { /* called from main if needed */ }

function getSessionUser(db) {
  if (!CURRENT_SESSION) return null;
  const p = db.prepare(`SELECT id, email, full_name FROM profiles WHERE id=?`).get(CURRENT_SESSION.userId);
  if (!p) return null;
  return { id: p.id, email: p.email, user_metadata: { full_name: p.full_name } };
}

function loadPersistedSession(db, dataDir, safeStorage) {
  try {
    const f = path.join(dataDir, "session.bin");
    if (!fs.existsSync(f)) return;
    const buf = fs.readFileSync(f);
    if (!safeStorage.isEncryptionAvailable()) return;
    const raw = safeStorage.decryptString(buf);
    const obj = JSON.parse(raw);
    if (obj && obj.userId) {
      const exists = db.prepare(`SELECT id FROM local_users WHERE id=?`).get(obj.userId);
      if (exists) CURRENT_SESSION = obj;
    }
  } catch {}
}

function persistSession(dataDir, safeStorage) {
  try {
    const f = path.join(dataDir, "session.bin");
    if (!CURRENT_SESSION) { if (fs.existsSync(f)) fs.unlinkSync(f); return; }
    if (!safeStorage.isEncryptionAvailable()) return;
    const enc = safeStorage.encryptString(JSON.stringify(CURRENT_SESSION));
    fs.writeFileSync(f, enc);
  } catch {}
}

// ===================== Register =====================
function registerHandlers(ipcMain, db, opts) {
  const { safeStorage, dataDir } = opts;
  loadPersistedSession(db, dataDir, safeStorage);

  ipcMain.handle("db:query", async (_e, q) => {
    try {
      const rows = runQuery(db, q);
      return { data: rows, error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  });
  ipcMain.handle("db:insert", async (_e, q) => {
    try {
      const rows = doInsert(db, q.table, q.values);
      return { data: rows, error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  });
  ipcMain.handle("db:update", async (_e, q) => {
    try {
      const rows = doUpdate(db, q.table, q.patch, q.filters);
      return { data: rows, error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  });
  ipcMain.handle("db:delete", async (_e, q) => {
    try {
      const rows = doDelete(db, q.table, q.filters);
      return { data: rows, error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  });
  ipcMain.handle("db:rpc", async (_e, { name, args }) => {
    try {
      const fn = RPCS[name];
      if (!fn) throw new Error("RPC desconhecida: " + name);
      const result = fn(db, args || {}, { userId: CURRENT_SESSION?.userId });
      return { data: result, error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  });

  // ============ Auth ============
  ipcMain.handle("auth:signUp", async (_e, { email, password, fullName }) => {
    try {
      email = String(email || "").trim().toLowerCase();
      if (!email || !password) throw new Error("Email e palavra-passe obrigatórios");
      const existing = db.prepare(`SELECT id FROM local_users WHERE email=?`).get(email);
      if (existing) throw new Error("Email já registado");
      const id = uuid();
      const hash = bcrypt.hashSync(String(password), 10);
      const count = db.prepare(`SELECT COUNT(*) AS c FROM local_users`).get().c;
      const role = count === 0 ? "admin" : "cashier";
      db.transaction(() => {
        db.prepare(`INSERT INTO local_users(id, email, password_hash) VALUES (?,?,?)`).run(id, email, hash);
        db.prepare(`INSERT INTO profiles(id, email, full_name) VALUES (?,?,?)`).run(id, email, fullName || email);
        db.prepare(`INSERT INTO user_roles(id, user_id, role) VALUES (?,?,?)`).run(uuid(), id, role);
      })();
      CURRENT_SESSION = { userId: id, email };
      persistSession(dataDir, safeStorage);
      return { data: { user: getSessionUser(db) }, error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  });

  ipcMain.handle("auth:signIn", async (_e, { email, password }) => {
    try {
      email = String(email || "").trim().toLowerCase();
      const u = db.prepare(`SELECT * FROM local_users WHERE email=?`).get(email);
      if (!u || !bcrypt.compareSync(String(password), u.password_hash)) {
        throw new Error("Credenciais inválidas");
      }
      const profile = db.prepare(`SELECT active FROM profiles WHERE id=?`).get(u.id);
      if (profile && profile.active === 0) throw new Error("Utilizador inativo");
      CURRENT_SESSION = { userId: u.id, email: u.email };
      persistSession(dataDir, safeStorage);
      return { data: { user: getSessionUser(db) }, error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  });

  ipcMain.handle("auth:signOut", async () => {
    CURRENT_SESSION = null;
    persistSession(dataDir, safeStorage);
    return { data: null, error: null };
  });

  ipcMain.handle("auth:getUser", async () => {
    return { data: { user: getSessionUser(db) }, error: null };
  });

  ipcMain.handle("auth:updateUser", async (_e, { password }) => {
    try {
      if (!CURRENT_SESSION) throw new Error("Não autenticado");
      if (password) {
        const hash = bcrypt.hashSync(String(password), 10);
        db.prepare(`UPDATE local_users SET password_hash=? WHERE id=?`).run(hash, CURRENT_SESSION.userId);
      }
      return { data: { user: getSessionUser(db) }, error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  });

  // Admin user management
  ipcMain.handle("admin:listUsers", async () => {
    try {
      if (!isAdmin(db, CURRENT_SESSION?.userId)) throw new Error("Permissão negada");
      const rows = db.prepare(`SELECT lu.id, lu.email, lu.created_at, p.full_name, p.active,
        (SELECT role FROM user_roles WHERE user_id=lu.id ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'pharmacist' THEN 2 ELSE 3 END LIMIT 1) AS role
        FROM local_users lu LEFT JOIN profiles p ON p.id=lu.id ORDER BY lu.created_at DESC`).all();
      return { data: rows.map((r) => ({ ...r, active: !!r.active })), error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  });
  ipcMain.handle("admin:createUser", async (_e, { email, password, fullName, role }) => {
    try {
      if (!isAdmin(db, CURRENT_SESSION?.userId)) throw new Error("Permissão negada");
      email = String(email || "").trim().toLowerCase();
      if (!email || !password) throw new Error("Email e palavra-passe obrigatórios");
      const exists = db.prepare(`SELECT id FROM local_users WHERE email=?`).get(email);
      if (exists) throw new Error("Email já registado");
      const id = uuid();
      const hash = bcrypt.hashSync(String(password), 10);
      db.transaction(() => {
        db.prepare(`INSERT INTO local_users(id, email, password_hash) VALUES (?,?,?)`).run(id, email, hash);
        db.prepare(`INSERT INTO profiles(id, email, full_name) VALUES (?,?,?)`).run(id, email, fullName || email);
        db.prepare(`INSERT INTO user_roles(id, user_id, role) VALUES (?,?,?)`).run(uuid(), id, role || "cashier");
      })();
      return { data: { id, email }, error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  });
  ipcMain.handle("admin:resetPassword", async (_e, { userId, password }) => {
    try {
      if (!isAdmin(db, CURRENT_SESSION?.userId)) throw new Error("Permissão negada");
      const hash = bcrypt.hashSync(String(password), 10);
      db.prepare(`UPDATE local_users SET password_hash=? WHERE id=?`).run(hash, userId);
      return { data: { ok: true }, error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  });
  ipcMain.handle("admin:deleteUser", async (_e, { userId }) => {
    try {
      if (!isAdmin(db, CURRENT_SESSION?.userId)) throw new Error("Permissão negada");
      if (userId === CURRENT_SESSION.userId) throw new Error("Não podes eliminar a tua própria conta");
      db.prepare(`DELETE FROM local_users WHERE id=?`).run(userId);
      return { data: { ok: true }, error: null };
    } catch (e) { return { data: null, error: { message: e.message } }; }
  });
}

module.exports = { registerHandlers };
