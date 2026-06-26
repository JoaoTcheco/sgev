// PharmaSys Desktop - Electron main process
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { initDatabase, getDb } = require('./db/init.cjs');
const { registerIpcHandlers } = require('./ipc/handlers.cjs');

let mainWindow = null;

function getUserDataDir() {
  const dir = path.join(app.getPath('appData'), 'PharmaSys');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'PharmaSys',
    backgroundColor: '#0b1220',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (process.env.PHARMASYS_DEV_URL) {
    mainWindow.loadURL(process.env.PHARMASYS_DEV_URL);
  } else if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadURL('data:text/html,<h1>PharmaSys: build SPA em falta. Execute npm run build:spa.</h1>');
  }

  mainWindow.setMenuBarVisibility(false);
  mainWindow.on('closed', () => { mainWindow = null; });

  // Abrir DevTools se PHARMASYS_DEBUG=1 ou se faltar o build SPA
  if (process.env.PHARMASYS_DEBUG === '1' || !fs.existsSync(indexPath)) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Atalho F12 para abrir/fechar DevTools em produção
  mainWindow.webContents.on('before-input-event', (_e, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools();
    }
    if ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Capturar crashes do renderer
  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    dialog.showErrorBox('Renderer falhou', JSON.stringify(details));
  });
  mainWindow.webContents.on('unresponsive', () => {
    dialog.showErrorBox('Janela sem resposta', 'O processo de UI parou de responder. Pressione F12 para abrir DevTools.');
  });
}

app.whenReady().then(async () => {
  const userDataDir = getUserDataDir();
  const dbPath = path.join(userDataDir, 'pharma.db');
  try {
    initDatabase(dbPath);
    registerIpcHandlers(ipcMain, { getDb, userDataDir, dbPath, dialog, shell, getWindow: () => mainWindow });
  } catch (err) {
    dialog.showErrorBox('Erro ao iniciar base de dados', String(err && err.stack || err));
    app.quit();
    return;
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
