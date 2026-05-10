const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const DATA_VERSION = 1;

function getDataFile(app) {
  return path.join(app.getPath("userData"), "secure-reception-data.vtdb");
}

function getKey(app) {
  const seed = `${os.userInfo().username}:${app.getPath("userData")}:vidyatech-reception`;
  return crypto.scryptSync(seed, "vidyatech-local-store", 32);
}

function encrypt(app, payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(app), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return JSON.stringify({
    version: DATA_VERSION,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64")
  });
}

function decrypt(app, raw) {
  const envelope = JSON.parse(raw);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(app), Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, "base64")),
    decipher.final()
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}

function readData(app) {
  const file = getDataFile(app);
  if (!fs.existsSync(file)) {
    return null;
  }

  return decrypt(app, fs.readFileSync(file, "utf8"));
}

function writeData(app, data) {
  const file = getDataFile(app);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, encrypt(app, { ...data, version: DATA_VERSION, updatedAt: new Date().toISOString() }));
  return { ok: true, file };
}

function saveBackup(app, targetPath, data) {
  fs.writeFileSync(targetPath, JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2));
  return { ok: true, file: targetPath };
}

function readBackup(targetPath) {
  return JSON.parse(fs.readFileSync(targetPath, "utf8"));
}

module.exports = {
  readData,
  writeData,
  saveBackup,
  readBackup
};
