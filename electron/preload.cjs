const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pharmasys", {
  invoke: (channel, payload) => ipcRenderer.invoke(channel, payload),
  onAuthChange: (cb) => {
    const fn = (_e, payload) => cb(payload);
    ipcRenderer.on("auth-change", fn);
    return () => ipcRenderer.removeListener("auth-change", fn);
  },
});
