// Bridge segura entre o renderer (React) e o processo principal
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pharmasys", {
  // CRUD genérico tabela/registo
  query: async (channel, payload) => {
    try {
      return await ipcRenderer.invoke(`db:${channel}`, payload);
    } catch (e) {
      // Limpa o prefixo "Error invoking remote method 'db:xxx':"
      const raw = e && e.message ? e.message : String(e);
      const cleaned = raw.replace(/^Error invoking remote method '[^']+':\s*(Error:\s*)?/i, "");
      throw new Error(cleaned);
    }
  },

  // Backup/restauro
  backupNow: () => ipcRenderer.invoke("app:backup-now"),
  restoreBackup: () => ipcRenderer.invoke("app:restore-backup"),
  openBackupsFolder: () => ipcRenderer.invoke("app:open-backups-folder"),
  openLogsFolder: () => ipcRenderer.invoke("app:open-logs-folder"),

  // Sessão
  isDesktop: true,
});
