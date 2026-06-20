const { contextBridge, ipcRenderer } = require("electron");

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld("api", {
  auth: {
    login: (email, password) => invoke("auth:login", { email, password }),
    logout: () => invoke("auth:logout"),
    currentUser: () => invoke("auth:current"),
    changePassword: (oldPassword, newPassword) =>
      invoke("auth:change-password", { oldPassword, newPassword }),
    needsBootstrap: () => invoke("auth:needs-bootstrap"),
    bootstrap: (data) => invoke("auth:bootstrap", data),
  },
  users: {
    list: () => invoke("users:list"),
    create: (data) => invoke("users:create", data),
    update: (data) => invoke("users:update", data),
    setRole: (userId, role) => invoke("users:set-role", { userId, role }),
    setActive: (userId, active) => invoke("users:set-active", { userId, active }),
    resetPassword: (userId, password) =>
      invoke("users:reset-password", { userId, password }),
    remove: (userId) => invoke("users:delete", { userId }),
  },
  settings: {
    get: () => invoke("settings:get"),
    save: (data) => invoke("settings:save", data),
  },
  audit: {
    list: (limit) => invoke("audit:list", { limit }),
  },
});
