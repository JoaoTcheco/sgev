// IPC handlers - thin layer; full RPC layer arrives in Phase 3.
const fs = require('node:fs');
const path = require('node:path');
const app = require('electron').app;

function registerIpcHandlers(ipcMain, ctx) {
  const { getDb, userDataDir, dbPath, dialog, shell, getWindow } = ctx;

  ipcMain.handle('pharma:app-info', () => ({
    version: app.getVersion(),
    name: app.getName(),
    userDataDir,
    dbPath,
    platform: process.platform,
  }));

  // Phase 1 placeholder - Phase 3 replaces with full select/insert/update/delete/rpc router.
  ipcMain.handle('pharma:db', (_evt, payload) => {
    return { ok: false, error: 'DB RPC ainda nao implementado (Fase 3). Recebido: ' + (payload && payload.op) };
  });

  // ---- Backups
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
      // better-sqlite3 backup API
      getDb().backup(dest).then(() => {/* ok */}).catch(() => {/* sync fallback below */});
      // Synchronous fallback copy (covers cases where async backup is rejected)
      if (!fs.existsSync(dest)) fs.copyFileSync(dbPath, dest);
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
    const src = result.filePaths[0];
    const confirm = await dialog.showMessageBox(win, {
      type: 'warning',
      title: 'Confirmar restauro',
      message: 'Vai substituir a base actual pelo backup escolhido. A app vai reiniciar.',
      buttons: ['Cancelar', 'Restaurar e reiniciar'],
      defaultId: 0,
      cancelId: 0,
    });
    if (confirm.response !== 1) return { ok: false, cancelled: true };
    try {
      getDb().close();
    } catch { /* ignore */ }
    fs.copyFileSync(src, dbPath);
    app.relaunch();
    app.exit(0);
    return { ok: true };
  });
}

module.exports = { registerIpcHandlers };
