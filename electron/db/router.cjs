// PharmaSys Desktop - PostgREST-style query router for SQLite.
// Supports the subset of the supabase-js builder API used by the app:
//   - select with column list (incl. embedded relation strings like
//     "products(name)" which become a SECOND query per parent row, mimicking
//     PostgREST FK joins)
//   - filters: eq, neq, gt, gte, lt, lte, ilike, like, in, is
//   - order, limit, range
//   - maybeSingle / single / count head=true
//   - insert / update / delete with optional returning select
//
// The renderer sends a JSON payload describing the query; this router
// translates it into a SQLite statement and returns { data, error, count }.

// Tables that have a single-row FK column equal to "<rel>_id" or where the
// relation is "<rel>"-singular. Used to resolve embedded selects.
const RELATIONS = {
  products: { from: 'products', via: 'id', parentFk: 'product_id', cardinality: 'one' },
  batches:  { from: 'batches',  via: 'product_id', parentFk: 'id',         cardinality: 'many' },
  sale_items: { from: 'sale_items', via: 'sale_id', parentFk: 'id', cardinality: 'many' },
  category: { from: 'categories', via: 'id', parentFk: 'category_id', cardinality: 'one' },
  categories: { from: 'categories', via: 'id', parentFk: 'category_id', cardinality: 'one' },
  supplier: { from: 'suppliers', via: 'id', parentFk: 'supplier_id', cardinality: 'one' },
  customer: { from: 'customers', via: 'id', parentFk: 'customer_id', cardinality: 'one' },
  profiles: { from: 'profiles', via: 'id', parentFk: 'user_id', cardinality: 'one' },
};

function parseSelect(selectStr) {
  // Returns { cols: ['a','b'], rels: [{name, columns}] }
  if (!selectStr || selectStr.trim() === '*') return { cols: ['*'], rels: [] };
  const cols = [];
  const rels = [];
  // Tokenize at top-level commas, respecting parentheses.
  let buf = '', depth = 0;
  const parts = [];
  for (const ch of selectStr) {
    if (ch === '(') { depth++; buf += ch; }
    else if (ch === ')') { depth--; buf += ch; }
    else if (ch === ',' && depth === 0) { parts.push(buf.trim()); buf = ''; }
    else buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());

  for (const p of parts) {
    const m = p.match(/^([a-z_][a-z0-9_]*)\((.*)\)$/i);
    if (m) {
      rels.push({ name: m[1], columns: m[2] || '*' });
    } else {
      cols.push(p);
    }
  }
  if (cols.length === 0) cols.push('*');
  return { cols, rels };
}

function buildWhere(filters) {
  const clauses = [];
  const params = [];
  for (const f of filters || []) {
    const { op, column, value } = f;
    switch (op) {
      case 'eq':  clauses.push(`${column} = ?`); params.push(value); break;
      case 'neq': clauses.push(`${column} <> ?`); params.push(value); break;
      case 'gt':  clauses.push(`${column} > ?`); params.push(value); break;
      case 'gte': clauses.push(`${column} >= ?`); params.push(value); break;
      case 'lt':  clauses.push(`${column} < ?`); params.push(value); break;
      case 'lte': clauses.push(`${column} <= ?`); params.push(value); break;
      case 'like':  clauses.push(`${column} LIKE ?`);  params.push(value); break;
      case 'ilike': clauses.push(`LOWER(${column}) LIKE LOWER(?)`); params.push(value); break;
      case 'in': {
        const arr = Array.isArray(value) ? value : [value];
        if (arr.length === 0) { clauses.push('0=1'); break; }
        clauses.push(`${column} IN (${arr.map(() => '?').join(',')})`);
        params.push(...arr);
        break;
      }
      case 'is':
        if (value === null) clauses.push(`${column} IS NULL`);
        else clauses.push(`${column} IS ?`), params.push(value);
        break;
      default: throw new Error(`Filtro nao suportado: ${op}`);
    }
  }
  return { sql: clauses.length ? 'WHERE ' + clauses.join(' AND ') : '', params };
}

function attachRelations(db, parentRows, table, rels) {
  if (!parentRows.length || !rels.length) return parentRows;
  for (const rel of rels) {
    const def = RELATIONS[rel.name];
    if (!def) continue; // silently ignore unknown
    const { cols: relCols } = parseSelect(rel.columns);
    const select = relCols.includes('*') ? '*' : relCols.join(', ');

    if (def.cardinality === 'one') {
      // parent.<parentFk> -> child.<via>
      const ids = [...new Set(parentRows.map(r => r[def.parentFk]).filter(v => v != null))];
      if (!ids.length) { for (const p of parentRows) p[rel.name] = null; continue; }
      const rows = db.prepare(
        `SELECT ${select}, ${def.via} AS __key FROM ${def.from} WHERE ${def.via} IN (${ids.map(() => '?').join(',')})`
      ).all(...ids);
      const map = new Map(rows.map(r => { const { __key, ...rest } = r; return [__key, rest]; }));
      for (const p of parentRows) p[rel.name] = map.get(p[def.parentFk]) || null;
    } else {
      // many: parent.<parentFk> -> child.<via>
      const ids = [...new Set(parentRows.map(r => r[def.parentFk]).filter(v => v != null))];
      if (!ids.length) { for (const p of parentRows) p[rel.name] = []; continue; }
      const rows = db.prepare(
        `SELECT ${select}, ${def.via} AS __key FROM ${def.from} WHERE ${def.via} IN (${ids.map(() => '?').join(',')})`
      ).all(...ids);
      const groups = new Map();
      for (const r of rows) {
        const { __key, ...rest } = r;
        if (!groups.has(__key)) groups.set(__key, []);
        groups.get(__key).push(rest);
      }
      for (const p of parentRows) p[rel.name] = groups.get(p[def.parentFk]) || [];
    }
  }
  return parentRows;
}

function runSelect(db, q) {
  const { table, select, filters, order, limit, range, count, head, singleMode } = q;
  const { cols, rels } = parseSelect(select);
  const colSql = cols.includes('*') ? '*' : cols.join(', ');
  const where = buildWhere(filters);
  const orderSql = (order || []).map(o => `${o.column} ${o.ascending ? 'ASC' : 'DESC'}`).join(', ');
  let sql = `SELECT ${colSql} FROM ${table} ${where.sql}`;
  if (orderSql) sql += ` ORDER BY ${orderSql}`;
  if (range) sql += ` LIMIT ${range.to - range.from + 1} OFFSET ${range.from}`;
  else if (limit) sql += ` LIMIT ${limit}`;

  let total = null;
  if (count === 'exact') {
    total = db.prepare(`SELECT COUNT(*) AS c FROM ${table} ${where.sql}`).get(...where.params).c;
  }

  if (head) {
    return { data: null, count: total };
  }

  let rows = db.prepare(sql).all(...where.params);
  if (rels.length) rows = attachRelations(db, rows, table, rels);

  if (singleMode === 'single') {
    if (rows.length === 0) throw new Error('Nenhuma linha encontrada');
    if (rows.length > 1) throw new Error('Mais de uma linha');
    return { data: rows[0], count: total };
  }
  if (singleMode === 'maybeSingle') {
    return { data: rows[0] || null, count: total };
  }
  return { data: rows, count: total };
}

function ensurePk(values, table) {
  if (table === 'pharmacy_settings') return values; // single-row table
  if (!values.id) values.id = require('node:crypto').randomUUID();
  return values;
}

function runInsert(db, q) {
  const { table, values, returning, returningSingleMode } = q;
  const rows = Array.isArray(values) ? values : [values];
  const ids = [];
  const tx = db.transaction(() => {
    for (let v of rows) {
      v = ensurePk({ ...v }, table);
      const cols = Object.keys(v);
      const placeholders = cols.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
      db.prepare(sql).run(...cols.map(c => normalize(v[c])));
      ids.push(v.id ?? db.prepare(`SELECT last_insert_rowid() AS id`).get().id);
    }
  });
  tx();

  if (!returning) return { data: null };
  const fetched = db.prepare(
    `SELECT * FROM ${table} WHERE id IN (${ids.map(() => '?').join(',')})`
  ).all(...ids);
  if (returningSingleMode === 'single') return { data: fetched[0] };
  if (returningSingleMode === 'maybeSingle') return { data: fetched[0] || null };
  return { data: fetched };
}

function runUpdate(db, q) {
  const { table, values, filters, returning } = q;
  const where = buildWhere(filters);
  const cols = Object.keys(values);
  const setSql = cols.map(c => `${c} = ?`).join(', ');
  const sql = `UPDATE ${table} SET ${setSql} ${where.sql}`;
  db.prepare(sql).run(...cols.map(c => normalize(values[c])), ...where.params);

  if (!returning) return { data: null };
  const fetched = db.prepare(`SELECT * FROM ${table} ${where.sql}`).all(...where.params);
  return { data: fetched };
}

function runDelete(db, q) {
  const where = buildWhere(q.filters);
  db.prepare(`DELETE FROM ${q.table} ${where.sql}`).run(...where.params);
  return { data: null };
}

function normalize(v) {
  if (v === undefined) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v instanceof Date) return v.toISOString();
  if (v && typeof v === 'object') return JSON.stringify(v);
  return v;
}

// Boolean coercion for known columns - SQLite stores INTEGER 0/1; renderer expects boolean.
const BOOL_COLS = new Set([
  'active', 'is_system', 'requires_prescription', 'show_pharmacist', 'resolved', 'read',
]);

function decodeRow(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (BOOL_COLS.has(k) && (v === 0 || v === 1)) out[k] = v === 1;
    else if (v && typeof v === 'object') out[k] = decodeRowArrayLike(v);
    else out[k] = v;
  }
  return out;
}

function decodeRowArrayLike(v) {
  if (Array.isArray(v)) return v.map(decodeRow);
  return decodeRow(v);
}

function decodeResult(result) {
  if (result == null) return result;
  if (Array.isArray(result.data)) result.data = result.data.map(decodeRow);
  else if (result.data && typeof result.data === 'object') result.data = decodeRow(result.data);
  return result;
}

function routeQuery(db, q) {
  switch (q.op) {
    case 'select': return decodeResult(runSelect(db, q));
    case 'insert': return decodeResult(runInsert(db, q));
    case 'update': return decodeResult(runUpdate(db, q));
    case 'delete': return decodeResult(runDelete(db, q));
    default: throw new Error('Operacao desconhecida: ' + q.op);
  }
}

module.exports = { routeQuery, parseSelect };
