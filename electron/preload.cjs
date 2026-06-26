// Bridge segura entre o renderer (React) e o processo principal
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pharmasys", {
  // CRUD genérico tabela/registo
  query: (channel, payload) => ipcRenderer.invoke(`db:${channel}`, payload),

  // Backup/restauro
  backupNow: () => ipcRenderer.invoke("app:backup-now"),
  restoreBackup: () => ipcRenderer.invoke("app:restore-backup"),
  openBackupsFolder: () => ipcRenderer.invoke("app:open-backups-folder"),

  // Sessão
  isDesktop: true,
});
