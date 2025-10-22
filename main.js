const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  const dataDir = app.getPath("userData");
  const licensePath = path.join(dataDir, "license.json");

  function getInstallationId() {
    const raw = os.hostname() + "|" + os.platform() + "|" + os.arch();
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  ipcMain.handle("get-installation-id", async () => getInstallationId());

  ipcMain.handle("save-license", async (event, data) => {
    fs.writeFileSync(licensePath, JSON.stringify(data, null, 2));
    return true;
  });

  ipcMain.handle("load-license", async () => {
    if (fs.existsSync(licensePath)) {
      return JSON.parse(fs.readFileSync(licensePath));
    }
    return null;
  });

  // ✅ Module resolver for packaged app
  ipcMain.handle("resolve-module", async (event, code) => {
    const moduleFile = path.join(process.resourcesPath, "app", "modules", `${code}.html`);
    const found = fs.existsSync(moduleFile);
    return { found, file: found ? `file://${moduleFile}` : null };
  });

  createWindow();
const { autoUpdater } = require("electron-updater");

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on("update-downloaded", () => {
  const { dialog } = require("electron");
  dialog.showMessageBox({
    type: "info",
    title: "Update Ready",
    message: "A new version is available. Restart to apply?",
    buttons: ["Restart", "Later"]
  }).then(result => {
    if (result.response === 0) autoUpdater.quitAndInstall();
  });
});

});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
