// PharmaSys Desktop - business RPCs ported from Postgres functions.
// Each function uses a synchronous SQLite transaction for atomicity.
const crypto = require('node:crypto');

function uuid() { return crypto.randomUUID(); }
function nowIso() { return new Date().toISOString(); }
function today() { return new Date().toISOString().slice(0, 10); }

// ---------- Roles ----------
function hasRole(db, userId, role) {
  if (!userId) return false;
  const r = db.prepare('SELECT 1 FROM user_roles WHERE user_id = ? AND role = ?').get(userId, role);
  return !!r;
}
function isAdmin(db, userId) { return hasRole(db, userId, 'admin'); }
function isStaff(db, userId) { return isAdmin(db, userId) || hasRole(db, userId, 'pharmacist'); }

// ---------- Cash session ----------
function openCashSession(db, userId, opening) {
  if (!userId) throw new Error('Nao autenticado');
  const existing = db.prepare(`SELECT id FROM cash_sessions WHERE user_id = ? AND status = 'open'`).get(userId);
  if (existing) throw new Error('Ja existe um turno aberto');
  const id = uuid();
  db.prepare(`INSERT INTO cash_sessions (id, user_id, opening_amount) VALUES (?, ?, ?)`).run(id, userId, Number(opening || 0));
  return id;
}

function closeCashSession(db, userId, counted, notes) {
  if (!userId) throw new Error('Nao autenticado');
  const session = db.prepare(`SELECT * FROM cash_sessions WHERE user_id = ? AND status = 'open'`).get(userId);
  if (!session) throw new Error('Sem turno aberto');
  const cashSales = db.prepare(
    `SELECT COALESCE(SUM(total), 0) AS s FROM sales WHERE cash_session_id = ? AND payment_method = 'cash' AND status = 'completed'`
  ).get(session.id).s || 0;
  const expected = Number(session.opening_amount) + Number(cashSales);
  const c = Number(counted || 0);
  db.prepare(`UPDATE cash_sessions
    SET status='closed', closed_at=?, counted_amount=?, expected_amount=?, difference=?, notes=?, updated_at=?
    WHERE id=?`).run(nowIso(), c, expected, c - expected, notes || null, nowIso(), session.id);
  return session.id;
}

// ---------- Batches ----------
function addBatchEntry(db, userId, { productId, supplierId, batchNumber, expiryDate, quantity, costPrice }) {
  if (!userId) throw new Error('Nao autenticado');
  if (!isStaff(db, userId)) throw new Error('Permissao negada');
  if (expiryDate < today()) throw new Error('Validade no passado');
  const id = uuid();
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO batches (id, product_id, supplier_id, batch_number, expiry_date, quantity, cost_price)
                VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, productId, supplierId || null, batchNumber, expiryDate, Number(quantity), Number(costPrice));
    db.prepare(`INSERT INTO stock_movements (id, batch_id, product_id, type, quantity, reason, user_id)
                VALUES (?, ?, ?, 'in', ?, 'Entrada de estoque', ?)`).run(uuid(), id, productId, Number(quantity), userId);
    refreshAlerts(db);
  });
  tx();
  return id;
}

// ---------- Accounts ----------
function deleteAccount(db, userId, accountId) {
  if (!isAdmin(db, userId)) throw new Error('Permissao negada');
  const acc = db.prepare(`SELECT is_system FROM financial_accounts WHERE id = ?`).get(accountId);
  if (!acc) throw new Error('Conta nao encontrada');
  if (acc.is_system) throw new Error('Conta do sistema nao pode ser eliminada');
  db.prepare(`DELETE FROM financial_accounts WHERE id = ?`).run(accountId);
}

function adjustAccount(db, userId, { accountId, type, amount, reason }) {
  if (!userId) throw new Error('Nao autenticado');
  if (!isAdmin(db, userId)) throw new Error('Permissao negada');
  if (!['credit', 'debit', 'reset'].includes(type)) throw new Error('Tipo invalido');
  const id = uuid();
  const tx = db.transaction(() => {
    const acc = db.prepare(`SELECT * FROM financial_accounts WHERE id = ?`).get(accountId);
    if (!acc) throw new Error('Conta nao encontrada');
    let delta = 0;
    if (type === 'reset') {
      delta = -acc.balance;
      db.prepare(`INSERT INTO account_movements (id, account_id, type, amount, reason, user_id)
                  VALUES (?, ?, 'reset', ?, ?, ?)`).run(id, accountId, acc.balance, reason || 'Zerar conta', userId);
      db.prepare(`UPDATE financial_accounts SET balance = 0, updated_at = ? WHERE id = ?`).run(nowIso(), accountId);
    } else {
      const amt = Number(amount);
      if (!(amt > 0)) throw new Error('Valor deve ser maior que zero');
      delta = type === 'credit' ? amt : -amt;
      db.prepare(`INSERT INTO account_movements (id, account_id, type, amount, reason, user_id)
                  VALUES (?, ?, ?, ?, ?, ?)`).run(id, accountId, type, amt, reason || null, userId);
      db.prepare(`UPDATE financial_accounts SET balance = balance + ?, updated_at = ? WHERE id = ?`).run(delta, nowIso(), accountId);
    }
  });
  tx();
  return id;
}

// ---------- Sales ----------
function processSale(db, userId, { customerId, paymentMethod, discount, items, accountId }) {
  if (!userId) throw new Error('Nao autenticado');
  const session = db.prepare(`SELECT id FROM cash_sessions WHERE user_id = ? AND status='open'`).get(userId);
  if (!session) throw new Error('Abra um turno de caixa antes de registar vendas');

  let useAccountId = accountId;
  if (!useAccountId) {
    const sys = db.prepare(`SELECT id FROM financial_accounts WHERE is_system=1 AND name='Caixa'`).get();
    if (!sys) throw new Error('Conta de destino nao definida');
    useAccountId = sys.id;
  }

  const saleId = uuid();
  const tx = db.transaction(() => {
    let subtotal = 0;
    for (const it of items) subtotal += Number(it.quantity) * Number(it.unit_price);
    const total = Math.max(0, subtotal - Number(discount || 0));

    // Sequence: receipt_number e sale_number
    db.prepare(`UPDATE sequences SET value = value + 1 WHERE name = 'sales_receipt'`).run();
    const seq = db.prepare(`SELECT value FROM sequences WHERE name='sales_receipt'`).get().value;
    db.prepare(`UPDATE sequences SET value = value + 1 WHERE name = 'sales_number'`).run();
    const saleNum = db.prepare(`SELECT value FROM sequences WHERE name='sales_number'`).get().value;
    const year = new Date().getFullYear();
    const receipt = `REC-${year}-${String(seq).padStart(6, '0')}`;

    db.prepare(`INSERT INTO sales (id, sale_number, receipt_number, customer_id, user_id, cash_session_id, account_id,
                                    subtotal, discount, total, payment_method, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`).run(
      saleId, saleNum, receipt, customerId || null, userId, session.id, useAccountId,
      subtotal, Number(discount || 0), total, paymentMethod
    );

    for (const it of items) {
      const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(it.product_id);
      if (!product) throw new Error('Produto nao encontrado');
      const pack = Math.max(1, product.pack_size || 1);
      const unitKind = it.unit_kind || 'pack';
      const qtyDisplay = Number(it.quantity);
      const unitPrice = Number(it.unit_price);
      const unitLabel = unitKind === 'sub'
        ? (product.sub_unit_label || 'unidade')
        : (product.unit || 'cx');
      const qtyUnits = unitKind === 'sub' ? qtyDisplay : qtyDisplay * pack;

      // Verifica stock total disponivel (lotes nao vencidos)
      const avail = db.prepare(
        `SELECT COALESCE(SUM(quantity),0) AS s FROM batches WHERE product_id=? AND quantity>0 AND expiry_date >= ?`
      ).get(product.id, today()).s || 0;
      if (avail < qtyUnits) {
        throw new Error(`Estoque insuficiente para ${product.name} (disponivel: ${avail}, necessario: ${qtyUnits}). Verifique lotes vencidos.`);
      }

      // FEFO + prioridade caixa aberta para vendas em sub-unidade
      const batches = db.prepare(`
        SELECT * FROM batches
        WHERE product_id = ? AND quantity > 0 AND expiry_date >= ?
        ORDER BY
          CASE WHEN ? = 'sub' AND ? > 1 AND (quantity % ?) <> 0 THEN 0 ELSE 1 END,
          expiry_date ASC,
          created_at ASC
      `).all(product.id, today(), unitKind, pack, pack);

      let remaining = qtyUnits;
      for (const b of batches) {
        if (remaining <= 0) break;
        const take = Math.min(b.quantity, remaining);
        db.prepare(`UPDATE batches SET quantity = quantity - ?, updated_at = ? WHERE id = ?`).run(take, nowIso(), b.id);

        const itemQty = unitKind === 'sub' ? take : Math.ceil(take / pack);
        const itemTotal = itemQty * unitPrice;

        db.prepare(`INSERT INTO sale_items (id, sale_id, product_id, batch_id, product_name,
                                             quantity, unit_price, total, unit_kind, unit_label)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          uuid(), saleId, product.id, b.id, product.name,
          itemQty, unitPrice, itemTotal, unitKind, unitLabel
        );

        db.prepare(`INSERT INTO stock_movements (id, batch_id, product_id, type, quantity, reason, user_id, reference_id)
                    VALUES (?, ?, ?, 'out', ?, 'Venda', ?, ?)`).run(
          uuid(), b.id, product.id, take, userId, saleId
        );

        remaining -= take;
      }
    }

    // Credita conta
    db.prepare(`INSERT INTO account_movements (id, account_id, type, amount, reason, sale_id, user_id)
                VALUES (?, ?, 'credit', ?, ?, ?, ?)`).run(
      uuid(), useAccountId, total, 'Venda ' + receipt, saleId, userId
    );
    db.prepare(`UPDATE financial_accounts SET balance = balance + ?, updated_at = ? WHERE id = ?`).run(
      total, nowIso(), useAccountId
    );

    refreshAlerts(db);
  });
  tx();
  return saleId;
}

// ---------- Alerts ----------
function refreshAlerts(db) {
  db.prepare(`DELETE FROM alerts WHERE resolved = 0`).run();
  const todayStr = today();

  // Stock baixo
  const stockRows = db.prepare(`
    SELECT p.id, p.name, p.min_stock,
      COALESCE((SELECT SUM(quantity) FROM batches b WHERE b.product_id = p.id AND b.expiry_date >= ?), 0) AS total_qty
    FROM products p WHERE p.active = 1
  `).all(todayStr);
  for (const r of stockRows) {
    if (r.total_qty === 0) {
      db.prepare(`INSERT INTO alerts (id, type, severity, product_id, message)
                  VALUES (?, 'low_stock', 'critical', ?, ?)`).run(uuid(), r.id, `${r.name} esta sem estoque`);
    } else if (r.total_qty <= Math.max(1, Math.floor(r.min_stock * 0.5))) {
      db.prepare(`INSERT INTO alerts (id, type, severity, product_id, message)
                  VALUES (?, 'low_stock', 'critical', ?, ?)`).run(uuid(), r.id,
        `${r.name} com estoque critico (${r.total_qty} un, min ${r.min_stock})`);
    } else if (r.total_qty <= r.min_stock) {
      db.prepare(`INSERT INTO alerts (id, type, severity, product_id, message)
                  VALUES (?, 'low_stock', 'warning', ?, ?)`).run(uuid(), r.id,
        `${r.name} abaixo do minimo (${r.total_qty}/${r.min_stock})`);
    }
  }

  // Validade
  const batchRows = db.prepare(`
    SELECT b.id, b.product_id, b.batch_number, b.expiry_date, p.name,
      CAST(julianday(b.expiry_date) - julianday(?) AS INTEGER) AS days_left,
      COALESCE(p.expiry_alert_days, 60) AS alert_days
    FROM batches b JOIN products p ON p.id = b.product_id
    WHERE b.quantity > 0
  `).all(todayStr);
  for (const r of batchRows) {
    const d = r.days_left;
    if (d < 0) {
      db.prepare(`INSERT INTO alerts (id, type, severity, product_id, batch_id, message)
                  VALUES (?, 'expired', 'critical', ?, ?, ?)`).run(uuid(), r.product_id, r.id,
        `${r.name} lote ${r.batch_number} VENCIDO ha ${Math.abs(d)} dias`);
    } else if (d === 0) {
      db.prepare(`INSERT INTO alerts (id, type, severity, product_id, batch_id, message)
                  VALUES (?, 'near_expiry', 'critical', ?, ?, ?)`).run(uuid(), r.product_id, r.id,
        `${r.name} lote ${r.batch_number} vence HOJE`);
    } else if (d <= Math.max(1, Math.floor(r.alert_days / 3))) {
      db.prepare(`INSERT INTO alerts (id, type, severity, product_id, batch_id, message)
                  VALUES (?, 'near_expiry', 'critical', ?, ?, ?)`).run(uuid(), r.product_id, r.id,
        `${r.name} lote ${r.batch_number} vence em ${d} dias`);
    } else if (d <= r.alert_days) {
      db.prepare(`INSERT INTO alerts (id, type, severity, product_id, batch_id, message)
                  VALUES (?, 'near_expiry', 'warning', ?, ?, ?)`).run(uuid(), r.product_id, r.id,
        `${r.name} lote ${r.batch_number} vence em ${d} dias`);
    }
  }
}

// ---------- User admin ----------
function adminSetUserRole(db, callerId, targetUserId, role) {
  if (!isAdmin(db, callerId)) throw new Error('Permissao negada');
  if (!['admin', 'pharmacist', 'cashier'].includes(role)) throw new Error('Role invalido');
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM user_roles WHERE user_id = ?`).run(targetUserId);
    db.prepare(`INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)`).run(uuid(), targetUserId, role);
  });
  tx();
}

function adminSetUserActive(db, callerId, targetUserId, active) {
  if (!isAdmin(db, callerId)) throw new Error('Permissao negada');
  db.prepare(`UPDATE profiles SET active = ?, updated_at = ? WHERE id = ?`).run(active ? 1 : 0, nowIso(), targetUserId);
}

function adminUpdateUser(db, callerId, targetUserId, fullName, email) {
  if (!isAdmin(db, callerId)) throw new Error('Permissao negada');
  if (email) {
    const dup = db.prepare(`SELECT 1 FROM users WHERE email = ? COLLATE NOCASE AND id <> ?`).get(email, targetUserId);
    if (dup) throw new Error('Email ja em uso');
    db.prepare(`UPDATE users SET email = ? WHERE id = ?`).run(email, targetUserId);
  }
  const patch = []; const vals = [];
  if (fullName) { patch.push('full_name = ?'); vals.push(fullName); }
  if (email)    { patch.push('email = ?');     vals.push(email); }
  if (patch.length) {
    patch.push('updated_at = ?'); vals.push(nowIso()); vals.push(targetUserId);
    db.prepare(`UPDATE profiles SET ${patch.join(', ')} WHERE id = ?`).run(...vals);
  }
}

function adminDeleteUser(db, callerId, targetUserId) {
  if (!isAdmin(db, callerId)) throw new Error('Permissao negada');
  if (callerId === targetUserId) throw new Error('Nao pode eliminar a propria conta');
  const targetIsAdmin = !!db.prepare(`SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'`).get(targetUserId);
  if (targetIsAdmin) {
    const c = db.prepare(`SELECT COUNT(*) AS c FROM user_roles WHERE role = 'admin'`).get().c;
    if (c <= 1) throw new Error('Nao e possivel eliminar o ultimo administrador');
  }
  db.prepare(`DELETE FROM users WHERE id = ?`).run(targetUserId);
}

module.exports = {
  uuid, nowIso, today,
  hasRole, isAdmin, isStaff,
  openCashSession, closeCashSession,
  addBatchEntry,
  deleteAccount, adjustAccount,
  processSale,
  refreshAlerts,
  adminSetUserRole, adminSetUserActive, adminUpdateUser, adminDeleteUser,
};
