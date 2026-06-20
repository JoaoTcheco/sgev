const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { getDb } = require("./db.cjs");

const SESSION_FILE = "session";

function uuid() {
  return crypto.randomUUID();
}

function hashPassword(p) {
  return bcrypt.hashSync(p, 10);
}

function verifyPassword(p, h) {
  return bcrypt.compareSync(p, h);
}

let currentSession = null; // { userId, email, fullName, roles[] }

function setSession(s) {
  currentSession = s;
}

function getSession() {
  return currentSession;
}

function requireAuth() {
  if (!currentSession) throw new Error("Não autenticado");
  return currentSession;
}

function requireAdmin() {
  const s = requireAuth();
  if (!s.roles.includes("admin")) throw new Error("Permissão negada — admin");
  return s;
}

function loadUserById(id) {
  const db = getDb();
  const profile = db
    .prepare("SELECT id, email, full_name, active FROM profiles WHERE id = ?")
    .get(id);
  if (!profile) return null;
  const roles = db
    .prepare("SELECT role FROM user_roles WHERE user_id = ?")
    .all(id)
    .map((r) => r.role);
  return { ...profile, roles };
}

function audit(entity, entityId, action, details) {
  const db = getDb();
  db.prepare(
    "INSERT INTO audit_logs (id, user_id, entity, entity_id, action, details) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(
    uuid(),
    currentSession ? currentSession.id : null,
    entity,
    entityId,
    action,
    details ? JSON.stringify(details) : null,
  );
}

module.exports = {
  uuid,
  hashPassword,
  verifyPassword,
  setSession,
  getSession,
  requireAuth,
  requireAdmin,
  loadUserById,
  audit,
};
