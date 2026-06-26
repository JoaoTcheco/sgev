// PharmaSys Desktop — processo principal Electron
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const net = require("net");
const { fork } = require("child_process");
const log = require("./logger.cjs");
const { initDatabase, getDb } = require("./db.cjs");
const registerHandlers = require("./ipc.cjs");

let mainWindow;
let nitroChild;

function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

function resolveServerEntry() {
  const candidates = [
    path.join(process.resourcesPath || "", "app", "dist-electron-server", "server", "index.mjs"),
    path.join(__dirname, "..", "dist-electron-server", "server", "index.mjs"),
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

async function startNitroServer() {
  const entry = resolveServerEntry();
  if (!entry) {
    throw new Error("Servidor interno não encontrado (dist-electron-server/server/index.mjs).");
  }
  const port = await findFreePort();
  log.info("A arrancar servidor interno em 127.0.0.1:" + port + " (" + entry + ")");
  nitroChild = fork(entry, [], {
    env: { ...process.env, NITRO_PORT: String(port), NITRO_HOST: "127.0.0.1", PORT: String(port), HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  nitroChild.stdout?.on("data", (d) => log.info("[server]", d.toString().trim()));
  nitroChild.stderr?.on("data", (d) => log.error("[server]", d.toString().trim()));
  nitroChild.on("exit", (code) => log.error("Servidor interno terminou com código", code));

  // espera ficar pronto
  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.status < 500) return url;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Servidor interno não respondeu a tempo.");
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "PharmaSys",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devUrl = process.env.PHARMASYS_DEV_URL;
  let targetUrl = devUrl;
  if (!targetUrl) {
    targetUrl = await startNitroServer();
  }
  await mainWindow.loadURL(targetUrl);
  mainWindow.show();
  if (devUrl) mainWindow.webContents.openDevTools({ mode: "detach" });

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
