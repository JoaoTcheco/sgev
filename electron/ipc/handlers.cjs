// PharmaSys Desktop - IPC handlers (Fase 3 completa)
const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');
const { routeQuery } = require('../db/router.cjs');
const auth = require('../db/auth.cjs');
const rpcs = require('../db/rpcs.cjs');

function registerIpcHandlers(ipcMain, ctx) {
  const { getDb, userDataDir, dbPath, dialog, shell, getWindow } = ctx;

  auth.setSessionFile(path.join(userDataDir, 'session.json'));

  ipcMain.handle('pharma:app-info', () => ({
    version: app.getVersion(),
    name: app.getName(),
    userDataDir, dbPath, platform: process.platform,
  }));

  // -------------- DB router --------------
  ipcMain.handle('pharma:db', (_evt, payload) => {
    try {
      const db = getDb();
      return { data: undefined, error: null, ...routeQuery(db, payload) };
    } catch (err) {
      return { data: null, error: { message: String(err.message || err) } };
    }
  });

  // -------------- Auth --------------
  ipcMain.handle('pharma:auth', (_evt, { op, ...args }) => {
    try {
      const db = getDb();
      switch (op) {
        case 'getUser':   return { data: { user: auth.getUser(db) }, error: null };
        case 'signIn':    return { data: { user: auth.signIn(db, args.email, args.password) }, error: null };
        case 'signOut':   auth.signOut(); return { data: {}, error: null };
        case 'signUp':    return { data: auth.signUp(db, args.email, args.password, args.fullName), error: null };
        case 'changePassword': auth.changePassword(db, args.userId, args.oldPassword, args.newPassword); return { data: {}, error: null };
        case 'adminResetPassword': auth.adminResetPassword(db, args.callerId, args.targetUserId, args.newPassword); return { data: {}, error: null };
        default: throw new Error('Op desconhecida: ' + op);
      }
    } catch (err) {
      return { data: null, error: { message: String(err.message || err) } };
    }
  });

  // -------------- Business RPCs --------------
  ipcMain.handle('pharma:rpc', (_evt, { name, args }) => {
    try {
      const db = getDb();
      const sess = auth.readSession();
      const userId = sess && sess.userId;
      const a = args || {};
      let result;
      switch (name) {
        case 'open_cash_session':
          result = rpcs.openCashSession(db, userId, a.p_opening); break;
        case 'close_cash_session':
          result = rpcs.closeCashSession(db, userId, a.p_counted, a.p_notes); break;
        case 'add_batch_entry':
          result = rpcs.addBatchEntry(db, userId, {
            productId: a.p_product_id, supplierId: a.p_supplier_id,
            batchNumber: a.p_batch_number, expiryDate: a.p_expiry_date,
            quantity: a.p_quantity, costPrice: a.p_cost_price,
          }); break;
        case 'delete_account':
          rpcs.deleteAccount(db, userId, a.p_account_id); result = null; break;
        case 'adjust_account':
          result = rpcs.adjustAccount(db, userId, {
            accountId: a.p_account_id, type: a.p_type, amount: a.p_amount, reason: a.p_reason,
          }); break;
        case 'process_sale':
          result = rpcs.processSale(db, userId, {
            customerId: a.p_customer_id, paymentMethod: a.p_payment_method,
            discount: a.p_discount, items: a.p_items, accountId: a.p_account_id,
          }); break;
        case 'refresh_alerts':
          rpcs.refreshAlerts(db); result = null; break;
        case 'admin_set_user_role':
          rpcs.adminSetUserRole(db, userId, a.p_user_id, a.p_role); result = null; break;
        case 'admin_set_user_active':
          rpcs.adminSetUserActive(db, userId, a.p_user_id, a.p_active); result = null; break;
        case 'admin_update_user':
          rpcs.adminUpdateUser(db, userId, a.p_user_id, a.p_full_name, a.p_email); result = null; break;
        case 'admin_delete_user':
          rpcs.adminDeleteUser(db, userId, a.p_user_id); result = null; break;
        case 'admin_reset_password':
          auth.adminResetPassword(db, userId, a.p_user_id, a.p_password); result = null; break;
        case 'has_role':
          result = rpcs.hasRole(db, a._user_id || userId, a._role); break;
        default: throw new Error('RPC desconhecido: ' + name);
      }
      return { data: result, error: null };
    } catch (err) {
      return { data: null, error: { message: String(err.message || err) } };
    }
  });

  // -------------- Backups --------------
  function backupsDir() {
    const docs = app.getPath('documents');
    const dir = path.join(docs, 'PharmaSys-Backups');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  ipcMain.handle('pharma:backup-now', () => {
    const dir = backupsDir();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dest = path.join(dir, `pharma-${stamp}.db`);
    try {
      fs.copyFileSync(dbPath, dest);
      return { ok: true, path: dest };
    } catch (err) {
      return { ok: false, error: String(err.message || err) };
    }
  });

  ipcMain.handle('pharma:list-backups', () => {
    const dir = backupsDir();
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.db'))
      .map(f => ({ name: f, path: path.join(dir, f), size: fs.statSync(path.join(dir, f)).size }))
      .sort((a, b) => b.name.localeCompare(a.name));
    return { ok: true, files, dir };
  });

  ipcMain.handle('pharma:open-backups-folder', () => {
    shell.openPath(backupsDir());
    return { ok: true };
  });

  ipcMain.handle('pharma:restore', async () => {
    const win = getWindow();
    const result = await dialog.showOpenDialog(win, {
      title: 'Restaurar backup',
      properties: ['openFile'],
      filters: [{ name: 'PharmaSys DB', extensions: ['db'] }],
      defaultPath: backupsDir(),
    });
    if (result.canceled || !result.filePaths[0]) return { ok: false, cancelled: true };
    const confirm = await dialog.showMessageBox(win, {
      type: 'warning', title: 'Confirmar restauro',
      message: 'Vai substituir a base actual pelo backup escolhido. A app vai reiniciar.',
      buttons: ['Cancelar', 'Restaurar e reiniciar'], defaultId: 0, cancelId: 0,
    });
    if (confirm.response !== 1) return { ok: false, cancelled: true };
    try { getDb().close(); } catch { /* ignore */ }
    fs.copyFileSync(result.filePaths[0], dbPath);
    app.relaunch();
    app.exit(0);
    return { ok: true };
  });
}

module.exports = { registerIpcHandlers };
