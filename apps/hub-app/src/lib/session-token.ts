import type { HubSession, PickupQrToken } from "./types";

export const hubSessionCookie = "yb_hub_session";
export const hubPickupQrCookie = "yb_hub_pickup_qr";

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function sessionSecret() {
  const configuredSecret = process.env.HUB_SESSION_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return "local-yobalelma-hub-demo-session";
}

async function signingKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign", "verify"],
  );
}

export async function createHubSessionToken(session: HubSession) {
  return createSignedValue(session);
}

export async function createHubPickupQrToken(token: PickupQrToken) {
  return createSignedValue(token);
}

async function createSignedValue(value: HubSession | PickupQrToken) {
  const secret = sessionSecret();

  if (!secret) {
    throw new Error("Hub session secret is required in production.");
  }

  const payload = bytesToBase64Url(encoder.encode(JSON.stringify(value)));
  const key = await signingKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return `${payload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyHubSessionToken(token?: string | null): Promise<HubSession | null> {
  const session = await verifySignedValue<HubSession>(token);

  if (!session?.expiresAt || session.expiresAt < Date.now()) return null;

  return session;
}

export async function verifyHubPickupQrToken(token?: string | null): Promise<PickupQrToken | null> {
  const pickup = await verifySignedValue<PickupQrToken>(token);

  if (!pickup?.expiresAt || new Date(pickup.expiresAt).getTime() < Date.now()) return null;

  return pickup;
}

async function verifySignedValue<T>(token?: string | null): Promise<T | null> {
  if (!token) {
    return null;
  }

  const secret = sessionSecret();

  if (!secret) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;

  if (!payload || !signature) {
    return null;
  }

  let payloadBytes: Uint8Array<ArrayBuffer>;
  let signatureBytes: Uint8Array<ArrayBuffer>;

  try {
    payloadBytes = base64UrlToBytes(payload);
    signatureBytes = base64UrlToBytes(signature);
  } catch {
    return null;
  }

  if (bytesToBase64Url(payloadBytes) !== payload || bytesToBase64Url(signatureBytes) !== signature) {
    return null;
  }

  const key = await signingKey(secret);
  const verified = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(payload),
  );

  if (!verified) {
    return null;
  }

  try {
    return JSON.parse(new TextDecoder().decode(payloadBytes)) as T;
  } catch {
    return null;
  }
}
