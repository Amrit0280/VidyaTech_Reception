const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputDir = process.env.DESKTOP_OUTPUT_DIR || "release-desktop";
const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
const electronBuilderCli = require.resolve("electron-builder/out/cli/cli.js");
const publishIndex = process.argv.indexOf("--publish");
const publishPolicy = publishIndex >= 0 ? process.argv[publishIndex + 1] || "always" : "never";

function run(command, args, env = {}) {
  execFileSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env }
  });
}

function cleanOutputDir() {
  const outputPath = path.resolve(root, outputDir);
  const relativeOutputPath = path.relative(root, outputPath);
  if (relativeOutputPath.startsWith("..") || path.isAbsolute(relativeOutputPath) || relativeOutputPath === "") {
    throw new Error(`Refusing to clean unsafe desktop output path: ${outputPath}`);
  }

  fs.rmSync(outputPath, { recursive: true, force: true });
}

function writeAppUpdateConfig() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const publishConfig = Array.isArray(packageJson.build.publish)
    ? packageJson.build.publish[0]
    : packageJson.build.publish;

  if (!publishConfig || publishConfig.provider !== "github") {
    throw new Error("GitHub publish config is required for desktop auto updates.");
  }

  const resourcesDir = path.join(root, outputDir, "win-unpacked", "resources");
  fs.mkdirSync(resourcesDir, { recursive: true });
  fs.writeFileSync(
    path.join(resourcesDir, "app-update.yml"),
    [
      "provider: github",
      `owner: ${publishConfig.owner}`,
      `repo: ${publishConfig.repo}`,
      "private: false",
      `updaterCacheDirName: ${packageJson.build.productName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-updater`,
      ""
    ].join("\n")
  );
}

cleanOutputDir();
run(process.execPath, [path.join(root, "scripts", "generate-vidyatech-ico.cjs")]);
run(process.execPath, [npmCli, "run", "build"]);
run(process.execPath, [electronBuilderCli, "--win", "dir"], {
  CSC_IDENTITY_AUTO_DISCOVERY: "false",
  DESKTOP_OUTPUT_DIR: outputDir
});
writeAppUpdateConfig();
run(process.execPath, [path.join(root, "scripts", "patch-desktop-icon.cjs")], {
  DESKTOP_OUTPUT_DIR: outputDir
});

const nsisArgs = ["--win", "nsis", "--prepackaged", path.join(root, outputDir, "win-unpacked")];
if (publishPolicy !== "never") {
  nsisArgs.push("--publish", publishPolicy);
}

run(process.execPath, [electronBuilderCli, ...nsisArgs], {
  CSC_IDENTITY_AUTO_DISCOVERY: "false",
  DESKTOP_OUTPUT_DIR: outputDir
});
