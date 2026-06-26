// PharmaSys Desktop - secure bridge between renderer and main
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pharmaDB', {
  query: (payload) => ipcRenderer.invoke('pharma:db', payload),
  auth: (payload) => ipcRenderer.invoke('pharma:auth', payload),
  rpc: (name, args) => ipcRenderer.invoke('pharma:rpc', { name, args }),
  backupNow: () => ipcRenderer.invoke('pharma:backup-now'),
  restoreBackup: () => ipcRenderer.invoke('pharma:restore'),
  listBackups: () => ipcRenderer.invoke('pharma:list-backups'),
  openBackupsFolder: () => ipcRenderer.invoke('pharma:open-backups-folder'),
  appInfo: () => ipcRenderer.invoke('pharma:app-info'),
});
