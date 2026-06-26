// Handlers IPC: expõem operações da BD ao renderer.
// Canal único `db:exec` com `op` interno para minimizar superfície.
const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

function uid() {
  return randomUUID();
}

module.exports = function registerHandlers(ipcMain, { getDb, dialog, shell, app }) {
  // ===== Auth =====
  ipcMain.handle("db:auth.bootstrap-needed", () => {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) AS n FROM profiles").get();
    return row.n === 0;
  });

  ipcMain.handle("db:auth.create-first-admin", (_e, { full_name, email, password }) => {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) AS n FROM profiles").get();
    if (row.n > 0) throw new Error("Já existem utilizadores");
    const id = uid();
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(
      "INSERT INTO profiles (id, full_name, email, password_hash) VALUES (?, ?, ?, ?)",
    ).run(id, full_name, email.toLowerCase(), hash);
    db.prepare("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')").run(uid(), id);
    return { id, full_name, email: email.toLowerCase(), role: "admin" };
  });

  ipcMain.handle("db:auth.sign-in", (_e, { email, password }) => {
    const db = getDb();
    const user = db
      .prepare("SELECT id, full_name, email, password_hash, active FROM profiles WHERE email = ?")
      .get(email.toLowerCase());
    if (!user) throw new Error("Credenciais inválidas");
    if (!user.active) throw new Error("Conta desactivada");
    if (!bcrypt.compareSync(password, user.password_hash)) throw new Error("Credenciais inválidas");
    const role = db.prepare("SELECT role FROM user_roles WHERE user_id = ?").get(user.id);
    return { id: user.id, full_name: user.full_name, email: user.email, role: role?.role ?? "cashier" };
  });

  ipcMain.handle("db:auth.change-password", (_e, { user_id, current_password, new_password }) => {
    const db = getDb();
    const user = db.prepare("SELECT password_hash FROM profiles WHERE id = ?").get(user_id);
    if (!user) throw new Error("Utilizador não encontrado");
    if (current_password && !bcrypt.compareSync(current_password, user.password_hash)) {
      throw new Error("Palavra-passe actual incorrecta");
    }
    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare("UPDATE profiles SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, user_id);
    return { ok: true };
  });

  // ===== CRUD genérico (somente leitura/escrita simples; vendas usam RPC abaixo) =====
  ipcMain.handle("db:select", (_e, { sql, params }) => {
    return getDb().prepare(sql).all(...(params ?? []));
  });

  ipcMain.handle("db:get", (_e, { sql, params }) => {
    return getDb().prepare(sql).get(...(params ?? []));
  });

  ipcMain.handle("db:run", (_e, { sql, params }) => {
    const info = getDb().prepare(sql).run(...(params ?? []));
    return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
  });

  ipcMain.handle("db:insert", (_e, { table, values }) => {
    const db = getDb();
    const id = values.id ?? uid();
    const row = { ...values, id };
    const cols = Object.keys(row);
    const placeholders = cols.map(() => "?").join(", ");
    db.prepare(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`).run(
      ...cols.map((c) => row[c]),
    );
    return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  });

  ipcMain.handle("db:update", (_e, { table, id, values }) => {
    const db = getDb();
    const cols = Object.keys(values);
    if (cols.length === 0) return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
    const set = cols.map((c) => `${c} = ?`).join(", ");
    db.prepare(`UPDATE ${table} SET ${set} WHERE id = ?`).run(...cols.map((c) => values[c]), id);
    return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  });

  ipcMain.handle("db:delete", (_e, { table, id }) => {
    const info = getDb().prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    return { changes: info.changes };
  });

  // ===== RPC: processar venda =====
  ipcMain.handle("db:rpc.process-sale", (_e, { user_id, customer_id, payment_method, discount, items, amount_received, change_due }) => {
    const db = getDb();
    const session = db
      .prepare("SELECT id FROM cash_sessions WHERE user_id = ? AND status = 'open'")
      .get(user_id);
    if (!session) throw new Error("Abra um turno de caixa antes de registar vendas");

    const tx = db.transaction(() => {
      let subtotal = 0;
      for (const it of items) subtotal += Number(it.quantity) * Number(it.unit_price);
      const total = Math.max(0, subtotal - Number(discount ?? 0));

      const year = new Date().getFullYear();
      const seq = db.prepare("SELECT COUNT(*) AS n FROM sales WHERE receipt_number LIKE ?").get(`REC-${year}-%`).n + 1;
      const receiptNumber = `REC-${year}-${String(seq).padStart(6, "0")}`;
      const saleId = uid();

      db.prepare(
        `INSERT INTO sales (id, receipt_number, customer_id, user_id, cash_session_id, subtotal, discount, total, payment_method, status, amount_received, change_due)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
      ).run(saleId, receiptNumber, customer_id ?? null, user_id, session.id, subtotal, Number(discount ?? 0), total, payment_method, amount_received ?? null, change_due ?? null);

      for (const it of items) {
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(it.product_id);
        if (!product) throw new Error("Produto não encontrado");
        const unitKind = it.unit_kind ?? "pack";
        const qtyDisplay = Number(it.quantity);
        const qtyUnits = unitKind === "sub" ? qtyDisplay : qtyDisplay * Math.max(1, product.pack_size);
        const unitLabel = unitKind === "sub" ? product.sub_unit_label ?? "unidade" : product.unit ?? "cx";

        let remaining = qtyUnits;
        const batches = db
          .prepare("SELECT * FROM batches WHERE product_id = ? AND quantity > 0 AND expiry_date >= date('now') ORDER BY expiry_date ASC")
          .all(it.product_id);

        for (const b of batches) {
          if (remaining <= 0) break;
          const take = Math.min(b.quantity, remaining);
          db.prepare("UPDATE batches SET quantity = quantity - ? WHERE id = ?").run(take, b.id);

          const qtyForItem = unitKind === "sub" ? take : Math.ceil(take / Math.max(1, product.pack_size));
          const totalForItem = qtyForItem * Number(it.unit_price);
          db.prepare(
            `INSERT INTO sale_items (id, sale_id, product_id, batch_id, product_name, quantity, unit_price, total, unit_kind, unit_label)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ).run(uid(), saleId, product.id, b.id, product.name, qtyForItem, Number(it.unit_price), totalForItem, unitKind, unitLabel);

          db.prepare(
            "INSERT INTO stock_movements (id, batch_id, product_id, type, quantity, reason, user_id, reference_id) VALUES (?, ?, ?, 'out', ?, 'Venda', ?, ?)",
          ).run(uid(), b.id, product.id, take, user_id, saleId);

          remaining -= take;
        }
        if (remaining > 0) throw new Error(`Estoque insuficiente para ${product.name}`);
      }

      return { id: saleId, receipt_number: receiptNumber, total };
    });
    return tx();
  });

  // ===== RPC: caixa =====
  ipcMain.handle("db:rpc.open-cash-session", (_e, { user_id, opening_amount }) => {
    const db = getDb();
    const open = db.prepare("SELECT id FROM cash_sessions WHERE user_id = ? AND status = 'open'").get(user_id);
    if (open) throw new Error("Já existe um turno aberto");
    const id = uid();
    db.prepare("INSERT INTO cash_sessions (id, user_id, opening_amount) VALUES (?, ?, ?)").run(id, user_id, Number(opening_amount ?? 0));
    return { id };
  });

  ipcMain.handle("db:rpc.close-cash-session", (_e, { user_id, counted_amount, notes }) => {
    const db = getDb();
    const session = db.prepare("SELECT * FROM cash_sessions WHERE user_id = ? AND status = 'open'").get(user_id);
    if (!session) throw new Error("Sem turno aberto");
    const cashSales = db
      .prepare("SELECT COALESCE(SUM(total), 0) AS s FROM sales WHERE cash_session_id = ? AND payment_method = 'cash' AND status = 'completed'")
      .get(session.id).s;
    const expected = Number(session.opening_amount) + Number(cashSales);
    const diff = Number(counted_amount ?? 0) - expected;
    db.prepare(
      `UPDATE cash_sessions SET status='closed', closed_at=datetime('now'),
       counted_amount=?, expected_amount=?, difference=?, notes=? WHERE id = ?`,
    ).run(Number(counted_amount ?? 0), expected, diff, notes ?? null, session.id);
    return { id: session.id, expected, difference: diff };
  });

  // ===== RPC: entrada de lote =====
  ipcMain.handle("db:rpc.add-batch", (_e, { user_id, product_id, supplier_id, batch_number, expiry_date, quantity, cost_price }) => {
    const db = getDb();
    const id = uid();
    db.prepare(
      "INSERT INTO batches (id, product_id, supplier_id, batch_number, expiry_date, quantity, cost_price) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(id, product_id, supplier_id ?? null, batch_number, expiry_date, Number(quantity), Number(cost_price ?? 0));
    db.prepare(
      "INSERT INTO stock_movements (id, batch_id, product_id, type, quantity, reason, user_id) VALUES (?, ?, ?, 'in', ?, 'Entrada de estoque', ?)",
    ).run(uid(), id, product_id, Number(quantity), user_id);
    return { id };
  });

  // ===== RPC: recalcular alertas =====
  ipcMain.handle("db:rpc.refresh-alerts", () => {
    const db = getDb();
    db.prepare("DELETE FROM alerts WHERE resolved = 0").run();

    const products = db
      .prepare(
        `SELECT p.id, p.name, p.min_stock,
                COALESCE((SELECT SUM(quantity) FROM batches WHERE product_id = p.id AND expiry_date >= date('now')), 0) AS total_qty
         FROM products p WHERE p.active = 1`,
      )
      .all();
    for (const r of products) {
      if (r.total_qty === 0) {
        db.prepare("INSERT INTO alerts (id, type, severity, product_id, message) VALUES (?, 'low_stock', 'critical', ?, ?)").run(uid(), r.id, `${r.name} está sem estoque`);
      } else if (r.total_qty <= r.min_stock * 0.5) {
        db.prepare("INSERT INTO alerts (id, type, severity, product_id, message) VALUES (?, 'low_stock', 'warning', ?, ?)").run(uid(), r.id, `${r.name} com estoque crítico (${r.total_qty} un)`);
      } else if (r.total_qty <= r.min_stock) {
        db.prepare("INSERT INTO alerts (id, type, severity, product_id, message) VALUES (?, 'low_stock', 'info', ?, ?)").run(uid(), r.id, `${r.name} próximo do mínimo (${r.total_qty} un)`);
      }
    }

    const batches = db
      .prepare(
        `SELECT b.id, b.product_id, b.batch_number, b.expiry_date, p.name,
                CAST(julianday(b.expiry_date) - julianday('now') AS INTEGER) AS days_left
         FROM batches b JOIN products p ON p.id = b.product_id WHERE b.quantity > 0`,
      )
      .all();
    for (const r of batches) {
      const d = r.days_left;
      let sev = null;
      let type = "near_expiry";
      if (d < 0) { sev = "critical"; type = "expired"; }
      else if (d <= 30) sev = "critical";
      else if (d <= 60) sev = "warning";
      else if (d <= 90) sev = "info";
      if (sev) {
        const msg = d < 0
          ? `${r.name} lote ${r.batch_number} VENCIDO`
          : `${r.name} lote ${r.batch_number} vence em ${d} dias`;
        db.prepare("INSERT INTO alerts (id, type, severity, product_id, batch_id, message) VALUES (?, ?, ?, ?, ?, ?)").run(uid(), type, sev, r.product_id, r.id, msg);
      }
    }
    return { ok: true };
  });

  // ===== Backup / Restauro =====
  ipcMain.handle("app:backup-now", async () => {
    const src = path.join(app.getPath("userData"), "pharmasys.db");
    const res = await dialog.showSaveDialog({
      title: "Guardar backup",
      defaultPath: `pharmasys-${new Date().toISOString().slice(0, 10)}.db`,
    });
    if (res.canceled || !res.filePath) return { ok: false };
    fs.copyFileSync(src, res.filePath);
    return { ok: true, path: res.filePath };
  });

  ipcMain.handle("app:restore-backup", async () => {
    const res = await dialog.showOpenDialog({
      title: "Restaurar de backup (.db)",
      properties: ["openFile"],
      filters: [{ name: "SQLite", extensions: ["db"] }],
    });
    if (res.canceled || !res.filePaths[0]) return { ok: false };
    const dest = path.join(app.getPath("userData"), "pharmasys.db");
    fs.copyFileSync(res.filePaths[0], dest);
    app.relaunch();
    app.exit(0);
    return { ok: true };
  });

  ipcMain.handle("app:open-backups-folder", () => {
    const dir = path.join(app.getPath("userData"), "backups");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    shell.openPath(dir);
    return { ok: true };
  });
};
