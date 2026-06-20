const { getDb } = require("../db.cjs");
const { requireAdmin } = require("./_shared.cjs");

function wrap(fn) {
  return async (_e, payload) => {
    try {
      return { data: await fn(payload), error: null };
    } catch (err) {
      return { data: null, error: { message: err.message } };
    }
  };
}

function registerAuditHandlers(ipcMain) {
  ipcMain.handle(
    "audit:list",
    wrap(({ limit } = {}) => {
      requireAdmin();
      const db = getDb();
      const rows = db
        .prepare(
          `SELECT a.*, p.email AS user_email, p.full_name AS user_name
           FROM audit_logs a LEFT JOIN profiles p ON p.id = a.user_id
           ORDER BY a.created_at DESC LIMIT ?`,
        )
        .all(Math.min(limit || 200, 1000));
      return rows;
    }),
  );
}

module.exports = { registerAuditHandlers };
