import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
const root = process.cwd();
loadEnvConfig(root, false, { info: () => undefined, error: () => undefined });
const email = process.argv[2]?.toLowerCase();
if (!email?.endsWith("@yobalelma.test")) throw new Error("A pilot email is required.");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url !== "https://rgcgtcycbiuhcaoaadbh.supabase.co" || !key) throw new Error("Yobalelma service credentials are required.");

const filePath = path.join(root, ".pilot-access", "credentials.json");
const bundle = JSON.parse(await readFile(filePath, "utf8"));
const credential = bundle.accounts.find((item) => item.email.toLowerCase() === email);
if (!credential) throw new Error("Pilot account not found in the protected bundle.");
const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const users = [];
for (let page = 1; page <= 50; page += 1) {
  const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw error;
  users.push(...data.users);
  if (data.users.length < 100) break;
}
const user = users.find((item) => item.email?.toLowerCase() === email);
if (!user) throw new Error("Pilot auth account not found.");
const temporaryPassword = `Yb!${randomBytes(24).toString("base64url")}#`;
const updated = await client.auth.admin.updateUserById(user.id, {
  password: temporaryPassword,
  user_metadata: { ...user.user_metadata, password_change_required: true },
});
if (updated.error) throw updated.error;
credential.temporaryPassword = temporaryPassword;
credential.rotatedAt = new Date().toISOString();
await writeFile(filePath, `${JSON.stringify(bundle, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
console.log(JSON.stringify({ email, ok: true, password: "rotated_and_protected" }));
