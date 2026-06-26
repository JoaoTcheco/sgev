// Local auth (substitui Supabase Auth)
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

let sessionFile = null;

function setSessionFile(file) { sessionFile = file; }

function readSession() {
  try {
    if (sessionFile && fs.existsSync(sessionFile)) {
      return JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
    }
  } catch { /* ignore */ }
  return null;
}

function writeSession(sess) {
  if (!sessionFile) return;
  fs.writeFileSync(sessionFile, JSON.stringify(sess), { mode: 0o600 });
}

function clearSession() {
  if (sessionFile && fs.existsSync(sessionFile)) {
    try { fs.unlinkSync(sessionFile); } catch { /* ignore */ }
  }
}

function getUser(db) {
  const sess = readSession();
  if (!sess) return null;
  const u = db.prepare(`SELECT u.id, u.email, p.full_name, p.active
                        FROM users u LEFT JOIN profiles p ON p.id = u.id
                        WHERE u.id = ?`).get(sess.userId);
  if (!u || u.active === 0) return null;
  return { id: u.id, email: u.email, user_metadata: { full_name: u.full_name } };
}

function signIn(db, email, password) {
  const row = db.prepare(`SELECT u.id, u.password_hash, p.active
                          FROM users u LEFT JOIN profiles p ON p.id = u.id
                          WHERE u.email = ? COLLATE NOCASE`).get(email);
  if (!row) throw new Error('Credenciais invalidas');
  if (row.active === 0) throw new Error('Utilizador desactivado');
  if (!bcrypt.compareSync(password, row.password_hash)) throw new Error('Credenciais invalidas');
  const token = crypto.randomBytes(24).toString('hex');
  writeSession({ userId: row.id, token, at: Date.now() });
  return getUser(db);
}

function signOut() { clearSession(); }

function signUp(db, email, password, fullName) {
  const exists = db.prepare(`SELECT 1 FROM users WHERE email = ? COLLATE NOCASE`).get(email);
  if (exists) throw new Error('Email ja registado');
  const id = crypto.randomUUID();
  const hash = bcrypt.hashSync(password, 10);
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`).run(id, email, hash);
    db.prepare(`INSERT INTO profiles (id, full_name, email, active) VALUES (?, ?, ?, 1)`).run(id, fullName || email, email);
    // primeira conta = admin; restantes = cashier
    const count = db.prepare(`SELECT COUNT(*) AS c FROM user_roles`).get().c;
    const role = count === 0 ? 'admin' : 'cashier';
    db.prepare(`INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)`).run(crypto.randomUUID(), id, role);
  });
  tx();
  return { id, email };
}

function changePassword(db, userId, oldPassword, newPassword) {
  const row = db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(userId);
  if (!row) throw new Error('Utilizador nao encontrado');
  if (!bcrypt.compareSync(oldPassword, row.password_hash)) throw new Error('Palavra-passe actual incorrecta');
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, userId);
}

function adminResetPassword(db, callerId, targetUserId, newPassword) {
  const isAdmin = !!db.prepare(`SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'`).get(callerId);
  if (!isAdmin) throw new Error('Permissao negada');
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, targetUserId);
}

module.exports = {
  setSessionFile, readSession, getUser,
  signIn, signOut, signUp,
  changePassword, adminResetPassword,
};
