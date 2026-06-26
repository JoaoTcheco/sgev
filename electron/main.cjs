// PharmaSys Desktop — processo principal Electron
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const log = require("./logger.cjs");
const { initDatabase, getDb } = require("./db.cjs");
const registerHandlers = require("./ipc.cjs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "PharmaSys",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devUrl = process.env.PHARMASYS_DEV_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.webContents.on("render-process-gone", (_e, details) => {
    log.error("Renderer crash:", details);
  });
  mainWindow.webContents.on("did-fail-load", (_e, code, desc, url) => {
    log.error("Falha ao carregar UI:", code, desc, url);
  });
}

process.on("uncaughtException", (err) => log.error("uncaughtException:", err));
process.on("unhandledRejection", (reason) => log.error("unhandledRejection:", reason));

app.whenReady().then(() => {
  try {
    log.init(app.getPath("userData"));
    const dbPath = path.join(app.getPath("userData"), "pharmasys.db");
    log.info("Arranque PharmaSys. BD:", dbPath);
    log.info("Logs em:", log.getDir());
    initDatabase(dbPath);
    registerHandlers(ipcMain, { getDb, dialog, shell, app, log });
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  } catch (e) {
    log.error("Falha crítica no arranque:", e);
    dialog.showErrorBox("Erro ao iniciar PharmaSys", String(e?.message ?? e));
    app.exit(1);
  }
});

// Canal para o renderer obter o caminho dos logs
ipcMain.handle("app:open-logs-folder", () => {
  const dir = log.getDir();
  if (dir) shell.openPath(dir);
  return { ok: true, path: dir };
});

app.on("window-all-closed", () => {
  // Backup automático ao fechar (cópia simples)
  try {
    const db = getDb();
    if (db) {
      const src = path.join(app.getPath("userData"), "pharmasys.db");
      const backupsDir = path.join(app.getPath("userData"), "backups");
      if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
      const stamp = new Date().toISOString().slice(0, 10);
      const dest = path.join(backupsDir, `pharmasys-${stamp}.db`);
      fs.copyFileSync(src, dest);
      log.info("Backup automático guardado em", dest);
    }
  } catch (e) {
    log.error("Falha no backup automático:", e);
  }
  if (process.platform !== "darwin") app.quit();
});
