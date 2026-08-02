import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

interface SyntheticPayload {
  kind: "synthetic-only";
  nonce: string;
  expiresAt: string;
}

function encode(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string, key: string): string {
  return createHmac("sha256", key).update(value).digest("base64url");
}

export function issueSyntheticCredential(key: string, now = new Date()): string {
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000);
  const payload: SyntheticPayload = {
    kind: "synthetic-only",
    nonce: randomBytes(24).toString("base64url"),
    expiresAt: expiresAt.toISOString(),
  };
  const encoded = encode(JSON.stringify(payload));
  return `synthetic.${encoded}.${sign(encoded, key)}`;
}

export function verifySyntheticCredential(token: string, key: string, now = new Date()): boolean {
  const [prefix, encoded, signature] = token.split(".");
  if (prefix !== "synthetic" || !encoded || !signature) return false;
  const expected = Buffer.from(sign(encoded, key));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SyntheticPayload;
    return payload.kind === "synthetic-only" && new Date(payload.expiresAt) > now;
  } catch {
    return false;
  }
}

export const SYNTHETIC_CREDENTIAL_WARNING =
  "This credential is deterministic reference plumbing, not an audited anonymous credential.";
