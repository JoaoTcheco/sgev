// PharmaSys Desktop — processo principal Electron
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
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
}

app.whenReady().then(() => {
  const dbPath = path.join(app.getPath("userData"), "pharmasys.db");
  console.log("[PharmaSys] BD local em:", dbPath);
  initDatabase(dbPath);
  registerHandlers(ipcMain, { getDb, dialog, shell, app });
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
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
    }
  } catch (e) {
    console.error("Falha no backup automático:", e);
  }
  if (process.platform !== "darwin") app.quit();
});
