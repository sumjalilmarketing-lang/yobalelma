import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { pilotAccounts } from "../../../scripts/pilot-account-catalog.mjs";
import { loadPilotCredentials, passwordFor } from "../../../scripts/pilot-credentials.mjs";

const { loadEnvConfig } = nextEnv;
const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const workspaceRoot = path.resolve(appDir, "../..");
loadEnvConfig(workspaceRoot, true);
const expectedUrl = "https://rgcgtcycbiuhcaoaadbh.supabase.co";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url !== expectedUrl || !serviceKey) throw new Error("Yobalelma service credentials are required.");
const credentialBundle = await loadPilotCredentials(workspaceRoot);
const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const accounts = pilotAccounts.filter((item) => item.application === "user");

for (const account of accounts) {
  const existing = await findUser(account.email);
  const attributes = {
    app_metadata: { yobalelma_user_pilot: true },
    email_confirm: true,
    password: passwordFor(credentialBundle, account.email),
    user_metadata: { full_name: account.name, password_change_required: true, primary_role: account.role },
  };
  const { data, error } = existing
    ? await supabase.auth.admin.updateUserById(existing.id, attributes)
    : await supabase.auth.admin.createUser({ ...attributes, email: account.email });
  if (error || !data.user) throw error ?? new Error(`User ${account.email} missing.`);
  const user = data.user;
  await ok(supabase.from("profiles").upsert({ id: user.id, account_status: "active", city: "Dakar", country: "Senegal", email: account.email, full_name: account.name, identity_status: "approved", is_verified: true, preferred_language: "fr", primary_role: account.role, role: account.role }), "profile");
  await ok(supabase.from("user_roles").delete().eq("profile_id", user.id), "old roles");
  await ok(supabase.from("user_roles").insert(account.roles.map((role) => ({ profile_id: user.id, role_id: role }))), "roles");
}

console.log(JSON.stringify({ ok: true, accounts: accounts.map(({ email, role, roles }) => ({ email, role, roles })) }));

async function findUser(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email);
    if (user || data.users.length < 100) return user ?? null;
  }
  return null;
}
async function ok(operation, label) { const { error } = await operation; if (error) throw new Error(`${label}: ${error.message}`); }
