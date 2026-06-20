const { getDb } = require("../db.cjs");
const {
  uuid,
  hashPassword,
  requireAdmin,
  loadUserById,
  audit,
} = require("./_shared.cjs");

function wrap(fn) {
  return async (_e, payload) => {
    try {
      return { data: await fn(payload), error: null };
    } catch (err) {
      return { data: null, error: { message: err.message } };
    }
  };
}

function registerUserHandlers(ipcMain) {
  ipcMain.handle(
    "users:list",
    wrap(() => {
      requireAdmin();
      const db = getDb();
      const profiles = db
        .prepare(
          "SELECT id, email, full_name, active, created_at FROM profiles ORDER BY created_at DESC",
        )
        .all();
      const roleRows = db.prepare("SELECT user_id, role FROM user_roles").all();
      const rolesByUser = new Map();
      for (const r of roleRows) {
        if (!rolesByUser.has(r.user_id)) rolesByUser.set(r.user_id, []);
        rolesByUser.get(r.user_id).push(r.role);
      }
      return profiles.map((p) => ({ ...p, roles: rolesByUser.get(p.id) || [] }));
    }),
  );

  ipcMain.handle(
    "users:create",
    wrap(({ email, password, fullName, role }) => {
      requireAdmin();
      if (!email || !password || password.length < 6)
        throw new Error("Email e password (>=6) obrigatórios");
      if (!["admin", "pharmacist", "cashier"].includes(role))
        throw new Error("Perfil inválido");
      const db = getDb();
      const exists = db
        .prepare("SELECT 1 FROM profiles WHERE email = ?")
        .get(email.toLowerCase());
      if (exists) throw new Error("Email já registado");
      const id = uuid();
      db.prepare(
        "INSERT INTO profiles (id, email, full_name, password_hash) VALUES (?, ?, ?, ?)",
      ).run(id, email.toLowerCase(), fullName || email, hashPassword(password));
      db.prepare(
        "INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)",
      ).run(uuid(), id, role);
      audit("user", id, "create", { email, role });
      return loadUserById(id);
    }),
  );

  ipcMain.handle(
    "users:update",
    wrap(({ userId, fullName, email }) => {
      requireAdmin();
      const db = getDb();
      const profile = db
        .prepare("SELECT id, email FROM profiles WHERE id = ?")
        .get(userId);
      if (!profile) throw new Error("Utilizador não encontrado");
      if (email && email.toLowerCase() !== profile.email) {
        const taken = db
          .prepare("SELECT 1 FROM profiles WHERE email = ? AND id <> ?")
          .get(email.toLowerCase(), userId);
        if (taken) throw new Error("Email já em uso");
      }
      db.prepare(
        "UPDATE profiles SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), updated_at = datetime('now') WHERE id = ?",
      ).run(fullName || null, email ? email.toLowerCase() : null, userId);
      audit("user", userId, "update", { fullName, email });
      return loadUserById(userId);
    }),
  );

  ipcMain.handle(
    "users:set-role",
    wrap(({ userId, role }) => {
      const admin = requireAdmin();
      if (!["admin", "pharmacist", "cashier"].includes(role))
        throw new Error("Perfil inválido");
      const db = getDb();
      // Prevent removing last admin
      if (userId === admin.id && role !== "admin") {
        const c = db
          .prepare("SELECT COUNT(*) AS c FROM user_roles WHERE role = 'admin'")
          .get();
        if (c.c <= 1)
          throw new Error("Não pode rebaixar o último administrador");
      }
      db.prepare("DELETE FROM user_roles WHERE user_id = ?").run(userId);
      db.prepare(
        "INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)",
      ).run(uuid(), userId, role);
      audit("user", userId, "set_role", { role });
      return loadUserById(userId);
    }),
  );

  ipcMain.handle(
    "users:set-active",
    wrap(({ userId, active }) => {
      const admin = requireAdmin();
      if (userId === admin.id && !active)
        throw new Error("Não pode desactivar a própria conta");
      const db = getDb();
      db.prepare(
        "UPDATE profiles SET active = ?, updated_at = datetime('now') WHERE id = ?",
      ).run(active ? 1 : 0, userId);
      audit("user", userId, "set_active", { active });
      return loadUserById(userId);
    }),
  );

  ipcMain.handle(
    "users:reset-password",
    wrap(({ userId, password }) => {
      const admin = requireAdmin();
      if (userId === admin.id)
        throw new Error("Use 'Alterar password' para a sua própria conta");
      if (!password || password.length < 6)
        throw new Error("Password muito curta");
      const db = getDb();
      db.prepare(
        "UPDATE profiles SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
      ).run(hashPassword(password), userId);
      audit("user", userId, "reset_password", null);
      return { ok: true };
    }),
  );

  ipcMain.handle(
    "users:delete",
    wrap(({ userId }) => {
      const admin = requireAdmin();
      if (userId === admin.id)
        throw new Error("Não pode eliminar a própria conta");
      const db = getDb();
      const isAdmin = db
        .prepare(
          "SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'",
        )
        .get(userId);
      if (isAdmin) {
        const c = db
          .prepare("SELECT COUNT(*) AS c FROM user_roles WHERE role = 'admin'")
          .get();
        if (c.c <= 1)
          throw new Error("Não pode eliminar o último administrador");
      }
      db.prepare("DELETE FROM profiles WHERE id = ?").run(userId);
      audit("user", userId, "delete", null);
      return { ok: true };
    }),
  );
}

module.exports = { registerUserHandlers };
