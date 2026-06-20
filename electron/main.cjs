const { app, BrowserWindow, ipcMain, safeStorage } = require("electron");
const path = require("path");
const fs = require("fs");
const { openDb, runMigrations } = require("./db.cjs");
const { registerHandlers } = require("./handlers.cjs");

let win;
let db;

function getDataDir() {
  const dir = path.join(app.getPath("userData"));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: "#0b1220",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.removeMenu();
  const indexHtml = path.join(__dirname, "..", "dist", "index.html");
  win.loadFile(indexHtml);
  win.once("ready-to-show", () => win.show());
}

app.whenReady().then(() => {
  const dbPath = path.join(getDataDir(), "pharmasys.db");
  db = openDb(dbPath);
  runMigrations(db);
  registerHandlers(ipcMain, db, { safeStorage, dataDir: getDataDir() });
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (db) try { db.close(); } catch {}
  if (process.platform !== "darwin") app.quit();
});
