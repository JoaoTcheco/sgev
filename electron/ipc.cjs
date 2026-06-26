const { BrowserWindow } = require("electron");
const q = require("./db/queries.cjs");

function ok(data) {
  return { ok: true, data };
}
function err(e) {
  return { ok: false, error: String(e?.message || e) };
}

function registerIpc(ipcMain) {
  const handlers = {
    "auth.signIn": q.authSignIn,
    "auth.signOut": q.authSignOut,
    "auth.getUser": q.authGetUser,
    "auth.changePassword": q.changeOwnPassword,
    "db.select": q.runSelect,
    "db.insert": q.runInsert,
    "db.update": q.runUpdate,
    "db.delete": q.runDelete,
    "rpc.process_sale": q.processSale,
    "rpc.add_batch_entry": q.addBatchEntry,
    "rpc.refresh_alerts": q.refreshAlerts,
    "rpc.open_cash_session": q.openCashSession,
    "rpc.close_cash_session": q.closeCashSession,
    "rpc.adjust_account": q.adjustAccount,
    "rpc.delete_account": q.deleteAccount,
    "admin.list_users": q.adminListUsers,
    "admin.create_user": q.adminCreateUser,
    "admin.update_user": q.adminUpdateUser,
    "admin.delete_user": q.adminDeleteUser,
  };

  for (const [name, fn] of Object.entries(handlers)) {
    ipcMain.handle("pharma:" + name, async (_e, payload) => {
      try {
        return ok(fn(payload || {}));
      } catch (e) {
        console.error("[ipc]", name, e);
        return err(e);
      }
    });
  }

  ipcMain.handle("pharma:print", () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.webContents.print({ silent: false, printBackground: true });
    return { ok: true };
  });
}

module.exports = { registerIpc };
