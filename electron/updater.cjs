const { BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

let updateWindow;
let updaterStarted = false;
let latestState = {
  title: "Checking for updates",
  message: "VidyaTech is checking for the newest desktop release.",
  percent: 0,
  status: "checking"
};

function log(message, detail) {
  if (detail) {
    console.log(`[updates] ${message}`, detail);
    return;
  }

  console.log(`[updates] ${message}`);
}

function formatBytes(bytes) {
  if (!bytes || Number.isNaN(bytes)) {
    return "";
  }

  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

function getUpdateHtml() {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VidyaTech Updates</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f6f9ff;
      color: #0e1726;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background:
        linear-gradient(135deg, rgba(21, 117, 255, 0.12), transparent 42%),
        radial-gradient(circle at top right, rgba(12, 186, 181, 0.16), transparent 38%),
        #f6f9ff;
    }
    main {
      width: min(360px, calc(100vw - 40px));
      border: 1px solid rgba(15, 23, 42, 0.1);
      background: rgba(255, 255, 255, 0.86);
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.16);
      border-radius: 16px;
      padding: 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
    }
    .mark {
      width: 42px;
      height: 42px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      background: linear-gradient(135deg, #1189d7, #1db9b8);
      color: white;
      font-weight: 800;
      font-size: 18px;
      box-shadow: 0 10px 30px rgba(17, 137, 215, 0.28);
    }
    h1 {
      margin: 0;
      font-size: 17px;
      line-height: 1.2;
      letter-spacing: 0;
    }
    p {
      margin: 7px 0 0;
      color: #536176;
      font-size: 13px;
      line-height: 1.5;
    }
    .meter {
      height: 10px;
      margin-top: 22px;
      overflow: hidden;
      border-radius: 999px;
      background: #dde7f5;
    }
    .bar {
      width: 0%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #1668f2, #18b7b4);
      transition: width 220ms ease;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 10px;
      color: #66758a;
      font-size: 12px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <main>
    <div class="brand">
      <div class="mark">V</div>
      <div>
        <h1 id="title">Checking for updates</h1>
        <p id="message">VidyaTech is checking for the newest desktop release.</p>
      </div>
    </div>
    <div class="meter" aria-hidden="true"><div class="bar" id="bar"></div></div>
    <div class="meta">
      <span id="status">Checking</span>
      <span id="percent">0%</span>
    </div>
  </main>
  <script>
    window.setUpdateState = (state) => {
      document.getElementById("title").textContent = state.title || "VidyaTech Updates";
      document.getElementById("message").textContent = state.message || "";
      document.getElementById("status").textContent = state.statusLabel || state.status || "Working";
      const percent = Math.max(0, Math.min(100, Number(state.percent || 0)));
      document.getElementById("bar").style.width = percent + "%";
      document.getElementById("percent").textContent = Math.round(percent) + "%";
    };
  </script>
</body>
</html>`;
}

function updatePopupState() {
  if (!updateWindow || updateWindow.isDestroyed()) {
    return;
  }

  updateWindow.webContents
    .executeJavaScript(`window.setUpdateState(${JSON.stringify(latestState)})`)
    .catch(() => {});
}

function showUpdateWindow(parentWindow, iconPath, state) {
  latestState = { ...latestState, ...state };

  if (!updateWindow || updateWindow.isDestroyed()) {
    updateWindow = new BrowserWindow({
      width: 430,
      height: 310,
      resizable: false,
      maximizable: false,
      minimizable: false,
      title: "VidyaTech Updates",
      parent: parentWindow || undefined,
      icon: iconPath,
      show: false,
      backgroundColor: "#f6f9ff",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    });

    updateWindow.removeMenu();
    updateWindow.on("closed", () => {
      updateWindow = undefined;
    });
    updateWindow.webContents.on("did-finish-load", updatePopupState);
    updateWindow.once("ready-to-show", () => updateWindow?.show());
    updateWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getUpdateHtml())}`);
    return;
  }

  updatePopupState();
  if (!updateWindow.isVisible()) {
    updateWindow.show();
  }
}

function closeUpdateWindow() {
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.close();
  }
}

function setupAutoUpdater(app, mainWindow, options = {}) {
  if (updaterStarted) {
    return;
  }

  if (!app.isPackaged && process.env.VIDYATECH_FORCE_UPDATE_CHECK !== "1") {
    log("Skipping auto-update check in development. Set VIDYATECH_FORCE_UPDATE_CHECK=1 to test manually.");
    return;
  }

  updaterStarted = true;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = {
    info: (message) => log(message),
    warn: (message) => console.warn(`[updates] ${message}`),
    error: (message) => console.error(`[updates] ${message}`),
    debug: (message) => log(message)
  };

  autoUpdater.on("checking-for-update", () => {
    log("Checking for updates");
  });

  autoUpdater.on("update-available", (info) => {
    log("Update available", { version: info.version, releaseDate: info.releaseDate });
    showUpdateWindow(mainWindow, options.iconPath, {
      title: `Update ${info.version} is available`,
      message: "VidyaTech is downloading the update in the background. You can continue working.",
      percent: 4,
      status: "downloading",
      statusLabel: "Starting download"
    });

    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "VidyaTech update available",
      message: `Version ${info.version} is available.`,
      detail: "The update will download in the background. You can keep using VidyaTech while it downloads.",
      buttons: ["OK"],
      defaultId: 0
    });
  });

  autoUpdater.on("update-not-available", (info) => {
    log("No updates available", { version: info.version });
    closeUpdateWindow();
  });

  autoUpdater.on("download-progress", (progress) => {
    const percent = Math.round(progress.percent || 0);
    log(`Download progress ${percent}%`, {
      transferred: formatBytes(progress.transferred),
      total: formatBytes(progress.total),
      bytesPerSecond: formatBytes(progress.bytesPerSecond)
    });

    showUpdateWindow(mainWindow, options.iconPath, {
      title: "Downloading VidyaTech update",
      message: `${formatBytes(progress.transferred)} of ${formatBytes(progress.total)} downloaded.`,
      percent,
      status: "downloading",
      statusLabel: `${formatBytes(progress.bytesPerSecond)}/s`
    });
  });

  autoUpdater.on("update-downloaded", async (info) => {
    log("Update downloaded", { version: info.version });
    showUpdateWindow(mainWindow, options.iconPath, {
      title: "Update ready to install",
      message: "Restart VidyaTech to install the downloaded update.",
      percent: 100,
      status: "ready",
      statusLabel: "Ready"
    });

    const result = await dialog.showMessageBox(mainWindow, {
      type: "question",
      title: "Restart VidyaTech?",
      message: "Update downloaded. Restart now?",
      detail: "VidyaTech will close, install the update, and reopen with the latest version.",
      buttons: ["Restart Now", "Later"],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      log("User accepted restart for update installation");
      autoUpdater.quitAndInstall(false, true);
    } else {
      log("User postponed update installation");
    }
  });

  autoUpdater.on("error", (error) => {
    const message = error?.message || String(error);
    console.error("[updates] Update error", error);
    if (updateWindow && !updateWindow.isDestroyed() && updateWindow.isVisible()) {
      showUpdateWindow(mainWindow, options.iconPath, {
        title: "Update check failed",
        message,
        percent: 0,
        status: "error",
        statusLabel: "Error"
      });
    }
  });

  setTimeout(() => {
    log("Starting update check");
    autoUpdater.checkForUpdatesAndNotify().catch((error) => {
      console.error("[updates] checkForUpdatesAndNotify failed", error);
    });
  }, 2500);
}

module.exports = {
  setupAutoUpdater
};
