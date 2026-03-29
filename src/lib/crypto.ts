import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const PREFIX = "enc1:";

function getKey(): Buffer {
  const s = process.env.OAUTH_TOKEN_SECRET || process.env.SECRET_KEY;
  if (!s) {
    throw new Error("OAUTH_TOKEN_SECRET 또는 SECRET_KEY가 필요합니다");
  }
  return scryptSync(s, "daily-briefing-oauth", 32);
}

export function hasOAuthEncryptionConfigured(): boolean {
  return Boolean(process.env.OAUTH_TOKEN_SECRET || process.env.SECRET_KEY);
}

/** refresh_token 등 민감 문자열 암호화 (AES-256-GCM) */
export function encryptOAuthToken(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decryptOAuthToken(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;
  const raw = Buffer.from(stored.slice(PREFIX.length), "base64url");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const key = getKey();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function encryptOAuthTokenIfConfigured(plain: string | undefined): string | undefined {
  if (!plain) return undefined;
  if (!hasOAuthEncryptionConfigured()) return plain;
  try {
    return encryptOAuthToken(plain);
  } catch {
    return plain;
  }
}

export function decryptOAuthTokenIfConfigured(stored: string | undefined): string | undefined {
  if (!stored) return undefined;
  if (!stored.startsWith(PREFIX)) return stored;
  try {
    return decryptOAuthToken(stored);
  } catch {
    return stored;
  }
}
