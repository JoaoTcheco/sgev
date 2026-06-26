const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pharmaApi", {
  invoke: (channel, payload) => ipcRenderer.invoke("pharma:" + channel, payload),
  print: () => ipcRenderer.invoke("pharma:print"),
});
