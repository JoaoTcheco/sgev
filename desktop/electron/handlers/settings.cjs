const { getDb } = require("../db.cjs");
const { requireAdmin, audit } = require("./_shared.cjs");

function wrap(fn) {
  return async (_e, payload) => {
    try {
      return { data: await fn(payload), error: null };
    } catch (err) {
      return { data: null, error: { message: err.message } };
    }
  };
}

function registerSettingsHandlers(ipcMain) {
  ipcMain.handle(
    "settings:get",
    wrap(() => {
      const db = getDb();
      return db.prepare("SELECT * FROM pharmacy_settings WHERE id = 1").get();
    }),
  );

  ipcMain.handle(
    "settings:save",
    wrap((data) => {
      requireAdmin();
      const db = getDb();
      db.prepare(
        `UPDATE pharmacy_settings SET
           name = COALESCE(?, name),
           address = COALESCE(?, address),
           phone = COALESCE(?, phone),
           email = COALESCE(?, email),
           tax_id = COALESCE(?, tax_id),
           currency = COALESCE(?, currency),
           receipt_footer = COALESCE(?, receipt_footer),
           low_stock_threshold = COALESCE(?, low_stock_threshold),
           expiry_warning_days = COALESCE(?, expiry_warning_days),
           updated_at = datetime('now')
         WHERE id = 1`,
      ).run(
        data.name ?? null,
        data.address ?? null,
        data.phone ?? null,
        data.email ?? null,
        data.tax_id ?? null,
        data.currency ?? null,
        data.receipt_footer ?? null,
        data.low_stock_threshold ?? null,
        data.expiry_warning_days ?? null,
      );
      audit("settings", "1", "update", data);
      return db.prepare("SELECT * FROM pharmacy_settings WHERE id = 1").get();
    }),
  );
}

module.exports = { registerSettingsHandlers };
