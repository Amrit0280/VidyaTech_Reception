import crypto from "crypto";

export function generatePassword() {
  const token = crypto.randomBytes(5).toString("base64url");
  return `School@${token}`;
}
