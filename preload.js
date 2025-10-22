
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getInstallationId: () => ipcRenderer.invoke("get-installation-id"),
  saveLicense: (data) => ipcRenderer.invoke("save-license", data),
  loadLicense: () => ipcRenderer.invoke("load-license"),
  resolveModule: (code) => ipcRenderer.invoke("resolve-module", code)   // << add this
});
