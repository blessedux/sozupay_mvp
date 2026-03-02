/**
 * Super-admin wallet unlock: derive Stellar key from passphrase and hold in memory (TTL).
 * Also persists to an encrypted cookie so the next request (e.g. payouts) sees the key
 * even when running in a different serverless instance.
 * Server-only: uses Node crypto; must not be imported from client code.
 */
import "server-only";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { Keypair } from "@stellar/stellar-sdk";

const UNLOCK_TTL_MS = 15 * 60 * 1000; // 15 minutes
const UNLOCK_COOKIE = "sozupay_unlock";
const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;

function getCookieKey(): Buffer {
  const secret = process.env.AUTH_SECRET ?? "dev-secret-change-in-production";
  return createHash("sha256").update(secret, "utf8").digest();
}

type Entry = { secretKey: string; expiresAt: number };

const store = new Map<string, Entry>();

function prune(): void {
  const now = Date.now();
  for (const [k, v] of store.entries()) {
    if (v.expiresAt <= now) store.delete(k);
  }
}

/**
 * Derive a Stellar keypair from passphrase + userId (deterministic).
 * Same passphrase + userId always yields the same keypair.
 */
export function deriveKeypairFromPassphrase(
  passphrase: string,
  userId: string
): Keypair {
  const seed = createHash("sha256")
    .update(passphrase + "\0" + userId, "utf8")
    .digest();
  if (seed.length !== 32) {
    throw new Error("Key derivation failed");
  }
  return Keypair.fromRawEd25519Seed(seed);
}

/**
 * Store the super admin's secret key in memory for the session. Call after they unlock with passphrase.
 */
export function setUnlockedKey(sessionId: string, secretKey: string): void {
  prune();
  store.set(sessionId, {
    secretKey,
    expiresAt: Date.now() + UNLOCK_TTL_MS,
  });
}

/**
 * Retrieve the unlocked key for the session if still valid.
 */
export function getUnlockedKey(sessionId: string): string | null {
  prune();
  const entry = store.get(sessionId);
  if (!entry || entry.expiresAt <= Date.now()) return null;
  return entry.secretKey;
}

/**
 * Clear unlocked key for the session (e.g. on logout).
 */
export function clearUnlockedKey(sessionId: string): void {
  store.delete(sessionId);
}

/** Public key we use for signing payouts: passphrase-derived if set, else registered wallet. */
export function getExpectedPayoutPublicKey(user: {
  stellar_payout_public_key: string | null;
  stellar_public_key: string | null;
}): string | null {
  return user.stellar_payout_public_key ?? user.stellar_public_key ?? null;
}

/** Cookie name for encrypted unlock payload (so callers can set/clear it). */
export const UNLOCK_COOKIE_NAME = UNLOCK_COOKIE;

/**
 * Build the value for the unlock cookie (encrypted secretKey + expiresAt).
 * Caller must set the cookie on the response with httpOnly, secure, sameSite, maxAge.
 */
export function buildUnlockCookieValue(secretKey: string): string {
  const expiresAt = Date.now() + UNLOCK_TTL_MS;
  const payload = JSON.stringify({ secretKey, expiresAt });
  const key = getCookieKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, enc]).toString("base64url");
}

/**
 * Read and decrypt the unlock cookie value. Returns the secret key if valid and not expired.
 */
export function getUnlockedKeyFromCookie(cookieValue: string | null | undefined): string | null {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  try {
    const key = getCookieKey();
    const buf = Buffer.from(cookieValue, "base64url");
    if (buf.length < IV_LEN + AUTH_TAG_LEN) return null;
    const iv = buf.subarray(0, IV_LEN);
    const authTag = buf.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
    const enc = buf.subarray(IV_LEN + AUTH_TAG_LEN);
    const decipher = createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(authTag);
    const payload = decipher.update(enc) + decipher.final("utf8");
    const { secretKey, expiresAt } = JSON.parse(payload) as { secretKey: string; expiresAt: number };
    if (typeof secretKey !== "string" || expiresAt <= Date.now()) return null;
    return secretKey;
  } catch {
    return null;
  }
}
