const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vidyaTechDesktop", {
  readData: () => ipcRenderer.invoke("reception:read-data"),
  writeData: (data) => ipcRenderer.invoke("reception:write-data", data),
  saveBackup: (data) => ipcRenderer.invoke("reception:save-backup", data),
  restoreBackup: () => ipcRenderer.invoke("reception:restore-backup"),
  printToPdf: () => ipcRenderer.invoke("reception:print-to-pdf"),
  syncLead: (payload) => ipcRenderer.invoke("reception:sync-lead", payload),
  platform: process.platform
});
