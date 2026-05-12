const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const path = require("path");
const { readBackup, readData, saveBackup, writeData } = require("./store.cjs");
const { setupAutoUpdater } = require("./updater.cjs");

const isDev = !app.isPackaged;
const appIcon = path.join(__dirname, "assets", "app-icon.ico");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    title: "VidyaTech Reception",
    icon: appIcon,
    backgroundColor: "#f8fbff",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  win.once("ready-to-show", () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    win.loadURL("http://localhost:5173/reception-app");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"), { hash: "/reception-app" });
  }

  return win;
}

app.whenReady().then(() => {
  const mainWindow = createWindow();
  setupAutoUpdater(app, mainWindow, { iconPath: appIcon });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const mainWindow = createWindow();
      setupAutoUpdater(app, mainWindow, { iconPath: appIcon });
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("reception:read-data", () => readData(app));
ipcMain.handle("reception:write-data", (_event, data) => writeData(app, data));

ipcMain.handle("reception:save-backup", async (_event, data) => {
  const result = await dialog.showSaveDialog({
    title: "Save VidyaTech backup",
    defaultPath: `vidyatech-reception-backup-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: "JSON Backup", extensions: ["json"] }]
  });

  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true };
  }

  return saveBackup(app, result.filePath, data);
});

ipcMain.handle("reception:restore-backup", async () => {
  const result = await dialog.showOpenDialog({
    title: "Restore VidyaTech backup",
    properties: ["openFile"],
    filters: [{ name: "JSON Backup", extensions: ["json"] }]
  });

  if (result.canceled || !result.filePaths[0]) {
    return { ok: false, canceled: true };
  }

  const data = readBackup(result.filePaths[0]);
  writeData(app, data);
  return { ok: true, data };
});

ipcMain.handle("reception:print-to-pdf", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showSaveDialog(win, {
    title: "Save receipt PDF",
    defaultPath: `vidyatech-receipt-${Date.now()}.pdf`,
    filters: [{ name: "PDF", extensions: ["pdf"] }]
  });

  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true };
  }

  const pdf = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: "A4",
    margins: { marginType: "default" }
  });
  require("fs").writeFileSync(result.filePath, pdf);
  return { ok: true, file: result.filePath };
});

ipcMain.handle("reception:print-receipt-html", async (_event, html) => {
  const receiptWindow = new BrowserWindow({
    width: 900,
    height: 1100,
    show: false,
    title: "Print Fee Receipt",
    icon: appIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  try {
    await receiptWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const result = await new Promise((resolve, reject) => {
      receiptWindow.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
        if (!success && failureReason) {
          reject(new Error(failureReason));
          return;
        }
        resolve({ ok: true, canceled: !success });
      });
    });
    return result;
  } finally {
    if (!receiptWindow.isDestroyed()) {
      receiptWindow.close();
    }
  }
});

ipcMain.handle("reception:sync-lead", async (_event, payload) => {
  const endpoint = process.env.VIDYATECH_SYNC_URL || process.env.VITE_API_URL || "";
  if (!endpoint) {
    return { ok: false, skipped: true, message: "No sync endpoint configured" };
  }

  const url = endpoint.endsWith("/leads") ? endpoint : `${endpoint.replace(/\/$/, "")}/leads`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Sync failed with ${response.status}`);
  }

  return { ok: true };
});
