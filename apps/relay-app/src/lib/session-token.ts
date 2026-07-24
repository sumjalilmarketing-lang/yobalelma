import type { RelaySession } from "./types";

export const relaySessionCookie = "yb_relay_session";
const encoder = new TextEncoder();

function base64url(bytes: Uint8Array) {
  let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}
function decode(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
function secret() {
  const value = process.env.RELAY_SESSION_SECRET?.trim();
  if (value) return value;
  return process.env.NODE_ENV === "production" ? null : "local-yobalelma-relay-session";
}
async function key(value: string) { return crypto.subtle.importKey("raw", encoder.encode(value), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]); }

export async function createRelaySessionToken(session: RelaySession) {
  const configured = secret(); if (!configured) throw new Error("Relay session secret is required in production.");
  const payload = base64url(encoder.encode(JSON.stringify(session)));
  const signature = await crypto.subtle.sign("HMAC", await key(configured), encoder.encode(payload));
  return `${payload}.${base64url(new Uint8Array(signature))}`;
}
export async function verifyRelaySessionToken(token?: string | null): Promise<RelaySession | null> {
  if (process.env.NODE_ENV === "production") return null;
  const configured = secret(); if (!token || !configured) return null;
  const [payload, signature, extra] = token.split("."); if (!payload || !signature || extra) return null;
  try {
    const valid = await crypto.subtle.verify("HMAC", await key(configured), decode(signature), encoder.encode(payload));
    if (!valid) return null;
    const session = JSON.parse(new TextDecoder().decode(decode(payload))) as RelaySession;
    return session.expiresAt > Date.now() && session.role ? session : null;
  } catch { return null; }
}
