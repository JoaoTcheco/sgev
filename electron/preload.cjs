// PharmaSys Desktop - secure bridge between renderer and main
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pharmaDB', {
  // Generic invoke: { op: 'select'|'insert'|'update'|'delete'|'rpc', ... }
  invoke: (payload) => ipcRenderer.invoke('pharma:db', payload),
  // Backup / restore / app info
  backupNow: () => ipcRenderer.invoke('pharma:backup-now'),
  restoreBackup: () => ipcRenderer.invoke('pharma:restore'),
  listBackups: () => ipcRenderer.invoke('pharma:list-backups'),
  openBackupsFolder: () => ipcRenderer.invoke('pharma:open-backups-folder'),
  appInfo: () => ipcRenderer.invoke('pharma:app-info'),
});
