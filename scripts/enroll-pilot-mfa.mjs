import { createHmac } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
const root = process.cwd();
loadEnvConfig(root, false, { info: () => undefined, error: () => undefined });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (url !== "https://rgcgtcycbiuhcaoaadbh.supabase.co" || !key) throw new Error("Yobalelma public credentials are required.");
const filePath = path.join(root, ".pilot-access", "credentials.json");
const bundle = JSON.parse(await readFile(filePath, "utf8"));
const protectedRoles = new Set(["super_admin", "admin", "country_manager", "security_manager", "auditor"]);
const results = [];

for (const account of bundle.accounts.filter((item) => item.application === "admin" && protectedRoles.has(item.role))) {
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const signIn = await client.auth.signInWithPassword({ email: account.email, password: account.temporaryPassword });
  if (signIn.error) throw signIn.error;
  if (account.mfa?.secret && account.mfa?.factorId) {
    results.push({ email: account.email, status: "already_enrolled" });
    await client.auth.signOut();
    continue;
  }
  const enrolled = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: `Yobalelma ${account.role}` });
  if (enrolled.error) throw enrolled.error;
  const factorId = enrolled.data.id;
  const secret = enrolled.data.totp.secret;
  const verified = await client.auth.mfa.challengeAndVerify({ factorId, code: totp(secret) });
  if (verified.error) throw verified.error;
  account.mfa = { factorId, secret, status: "verified", uri: enrolled.data.totp.uri };
  results.push({ email: account.email, status: "verified" });
  await client.auth.signOut();
}

await writeFile(filePath, `${JSON.stringify(bundle, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
console.log(JSON.stringify({ ok: true, factors: results }));

function totp(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = secret.replace(/=+$/u, "").toUpperCase();
  let bits = "";
  for (const character of clean) bits += alphabet.indexOf(character).toString(2).padStart(5, "0");
  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  const counter = Math.floor(Date.now() / 30_000);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", Buffer.from(bytes)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}
