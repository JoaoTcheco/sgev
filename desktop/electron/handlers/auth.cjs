const { getDb } = require("../db.cjs");
const {
  uuid,
  hashPassword,
  verifyPassword,
  setSession,
  getSession,
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

function registerAuthHandlers(ipcMain) {
  ipcMain.handle(
    "auth:needs-bootstrap",
    wrap(() => {
      const db = getDb();
      const row = db.prepare("SELECT COUNT(*) AS c FROM profiles").get();
      return { needsBootstrap: row.c === 0 };
    }),
  );

  ipcMain.handle(
    "auth:bootstrap",
    wrap(({ email, password, fullName }) => {
      const db = getDb();
      const row = db.prepare("SELECT COUNT(*) AS c FROM profiles").get();
      if (row.c > 0) throw new Error("Já existe um administrador");
      if (!email || !password || password.length < 6)
        throw new Error("Email e password válidos são obrigatórios");
      const id = uuid();
      db.prepare(
        "INSERT INTO profiles (id, email, full_name, password_hash) VALUES (?, ?, ?, ?)",
      ).run(id, email.toLowerCase(), fullName || email, hashPassword(password));
      db.prepare(
        "INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')",
      ).run(uuid(), id);
      const user = loadUserById(id);
      setSession(user);
      return user;
    }),
  );

  ipcMain.handle(
    "auth:login",
    wrap(({ email, password }) => {
      const db = getDb();
      const row = db
        .prepare(
          "SELECT id, email, full_name, password_hash, active FROM profiles WHERE email = ?",
        )
        .get((email || "").toLowerCase());
      if (!row) throw new Error("Credenciais inválidas");
      if (!row.active) throw new Error("Conta desactivada");
      if (!verifyPassword(password, row.password_hash))
        throw new Error("Credenciais inválidas");
      const user = loadUserById(row.id);
      setSession(user);
      audit("auth", row.id, "login", null);
      return user;
    }),
  );

  ipcMain.handle(
    "auth:logout",
    wrap(() => {
      const s = getSession();
      if (s) audit("auth", s.id, "logout", null);
      setSession(null);
      return { ok: true };
    }),
  );

  ipcMain.handle(
    "auth:current",
    wrap(() => getSession()),
  );

  ipcMain.handle(
    "auth:change-password",
    wrap(({ oldPassword, newPassword }) => {
      const s = getSession();
      if (!s) throw new Error("Não autenticado");
      if (!newPassword || newPassword.length < 6)
        throw new Error("Nova password muito curta");
      const db = getDb();
      const row = db
        .prepare("SELECT password_hash FROM profiles WHERE id = ?")
        .get(s.id);
      if (!verifyPassword(oldPassword, row.password_hash))
        throw new Error("Password actual incorrecta");
      db.prepare(
        "UPDATE profiles SET password_hash = ?, updated_at = datetime('now') WHERE id = ?",
      ).run(hashPassword(newPassword), s.id);
      audit("auth", s.id, "change_password", null);
      return { ok: true };
    }),
  );
}

module.exports = { registerAuthHandlers };
