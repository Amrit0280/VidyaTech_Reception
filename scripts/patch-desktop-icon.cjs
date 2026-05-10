const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputDir = process.env.DESKTOP_OUTPUT_DIR || "release-desktop";
const exePath = path.join(root, outputDir, "win-unpacked", "VidyaTech Reception.exe");
const iconPath = path.join(root, "electron", "assets", "app-icon.ico");

function findRcedit() {
  const localRcedit = path.join(
    root,
    "node_modules",
    "rcedit",
    "bin",
    process.arch === "ia32" ? "rcedit.exe" : "rcedit-x64.exe"
  );

  if (fs.existsSync(localRcedit)) {
    return localRcedit;
  }

  const cacheRoot = path.join(os.homedir(), "AppData", "Local", "electron-builder", "Cache", "winCodeSign");
  if (!fs.existsSync(cacheRoot)) {
    throw new Error(`rcedit was not found in node_modules or Electron Builder cache: ${cacheRoot}`);
  }

  const stack = [cacheRoot];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.name === "rcedit-x64.exe") {
        return fullPath;
      }
    }
  }

  throw new Error("Could not find rcedit-x64.exe in the Electron Builder cache.");
}

if (!fs.existsSync(exePath)) {
  throw new Error(`Packaged executable was not found: ${exePath}`);
}

if (!fs.existsSync(iconPath)) {
  throw new Error(`Icon file was not found: ${iconPath}`);
}

const rcedit = findRcedit();
execFileSync(rcedit, [
  exePath,
  "--set-icon",
  iconPath,
  "--set-version-string",
  "FileDescription",
  "VidyaTech Reception",
  "--set-version-string",
  "ProductName",
  "VidyaTech Reception",
  "--set-version-string",
  "CompanyName",
  "VidyaTech"
], { stdio: "inherit" });

console.log(`Patched executable icon: ${exePath}`);
