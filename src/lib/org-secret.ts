/**
 * Encrypt / decrypt the organization's Stellar disbursement secret for storage.
 * Server-only. Uses AUTH_SECRET + org_id so only our backend can decrypt.
 */
import "server-only";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;
const KEY_LEN = 32;

function getKeyForOrg(orgId: string): Buffer {
  const secret = process.env.AUTH_SECRET ?? "dev-secret-change-in-production";
  return createHash("sha256")
    .update(secret + "\0" + orgId, "utf8")
    .digest();
}

/**
 * Encrypt the org's Stellar secret key for storage.
 * Returns base64url string: iv (12) + authTag (16) + ciphertext.
 */
export function encryptOrgSecret(orgId: string, secretKey: string): string {
  const key = getKeyForOrg(orgId);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([
    cipher.update(secretKey, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, enc]).toString("base64url");
}

/**
 * Decrypt the org's Stellar secret key.
 * ciphertext is the value stored in stellar_disbursement_secret_encrypted.
 */
export function decryptOrgSecret(
  orgId: string,
  encryptedBase64: string
): string {
  const key = getKeyForOrg(orgId);
  const buf = Buffer.from(encryptedBase64, "base64url");
  if (buf.length < IV_LEN + AUTH_TAG_LEN) {
    throw new Error("Invalid encrypted org secret");
  }
  const iv = buf.subarray(0, IV_LEN);
  const authTag = buf.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
  const enc = buf.subarray(IV_LEN + AUTH_TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(enc) + decipher.final("utf8");
}
