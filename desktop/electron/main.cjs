// Electron main process
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { initDb } = require("./db.cjs");
const { registerAuthHandlers } = require("./handlers/auth.cjs");
const { registerUserHandlers } = require("./handlers/users.cjs");
const { registerSettingsHandlers } = require("./handlers/settings.cjs");
const { registerAuditHandlers } = require("./handlers/audit.cjs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: "PharmaSys",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  const isDev = !app.isPackaged && process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  initDb();
  registerAuthHandlers(ipcMain);
  registerUserHandlers(ipcMain);
  registerSettingsHandlers(ipcMain);
  registerAuditHandlers(ipcMain);

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
