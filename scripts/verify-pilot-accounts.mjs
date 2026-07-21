import { createHmac } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { pilotAccounts, pilotApplications } from "./pilot-account-catalog.mjs";
import { loadPilotCredentials, passwordFor } from "./pilot-credentials.mjs";

const { loadEnvConfig } = nextEnv;
const root = process.cwd();
loadEnvConfig(root, false, { info: () => undefined, error: () => undefined });

const expectedUrl = "https://rgcgtcycbiuhcaoaadbh.supabase.co";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url !== expectedUrl || !publicKey || !serviceKey) throw new Error("Yobalelma credentials are required.");

const bundle = await loadPilotCredentials(root);
const service = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const authUsers = await listAllUsers();
const results = [];

for (const account of pilotAccounts) {
  const credential = bundle.accounts.find((item) => item.email === account.email);
  if (!credential) throw new Error(`Protected credential missing for ${account.email}.`);
  const authUser = authUsers.find((item) => item.email?.toLowerCase() === account.email.toLowerCase());
  if (!authUser) throw new Error(`Auth user missing for ${account.email}.`);

  const [{ data: profile, error: profileError }, { data: assignedRoles, error: rolesError }] = await Promise.all([
    service.from("profiles").select("account_status,email,is_verified,primary_role,role").eq("id", authUser.id).single(),
    service.from("user_roles").select("role_id").eq("profile_id", authUser.id),
  ]);
  if (profileError) throw profileError;
  if (rolesError) throw rolesError;

  const actualRoles = assignedRoles.map((item) => item.role_id);
  for (const expectedRole of account.roles) {
    if (!actualRoles.includes(expectedRole)) throw new Error(`Role mismatch for ${account.email}: ${expectedRole}.`);
  }

  const client = createClient(url, publicKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const signIn = await client.auth.signInWithPassword({ email: account.email, password: passwordFor(bundle, account.email) });
  if (signIn.error || !signIn.data.session) throw signIn.error ?? new Error(`Session missing for ${account.email}.`);
  const persisted = await client.auth.getSession();
  if (persisted.error || persisted.data.session?.user.id !== authUser.id) throw persisted.error ?? new Error(`Session check failed for ${account.email}.`);

  let mfa = "not_enrolled";
  if (credential.mfa?.status === "verified") {
    const challenge = await client.auth.mfa.challengeAndVerify({ factorId: credential.mfa.factorId, code: totp(credential.mfa.secret) });
    if (challenge.error) throw challenge.error;
    const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error || assurance.data.currentLevel !== "aal2") throw assurance.error ?? new Error(`AAL2 failed for ${account.email}.`);
    mfa = "aal2_verified";
  }

  const escalation = account.role === "super_admin" ? "not_applicable" : await assertEscalationDenied(client, authUser.id, profile);
  const signOut = await client.auth.signOut();
  if (signOut.error) throw signOut.error;
  const afterSignOut = await client.auth.getSession();
  if (afterSignOut.data.session) throw new Error(`Sign-out failed for ${account.email}.`);

  results.push({
    application: pilotApplications[account.application].label,
    deliver: account.deliver,
    email: account.email,
    emailVerified: Boolean(authUser.email_confirmed_at),
    mfa,
    passwordChangeRequired: authUser.user_metadata?.password_change_required === true,
    profileActive: profile.account_status === "active",
    profileVerified: profile.is_verified === true,
    roles: actualRoles,
    roleEscalation: escalation,
    session: "verified",
    signOut: "verified",
    status: "active",
  });
}

const output = {
  generatedAt: new Date().toISOString(),
  productionUiValidation: "pending",
  summary: {
    accounts: results.length,
    deliverable: results.filter((item) => item.deliver).length,
    emailVerified: results.filter((item) => item.emailVerified).length,
    mfaAal2Verified: results.filter((item) => item.mfa === "aal2_verified").length,
    sessionsVerified: results.filter((item) => item.session === "verified").length,
  },
  accounts: results,
};
const targetDir = path.join(root, ".pilot-access");
await mkdir(targetDir, { recursive: true });
await writeFile(path.join(targetDir, "verification.json"), `${JSON.stringify(output, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
console.log(JSON.stringify({ ok: true, summary: output.summary }));

async function assertEscalationDenied(client, userId, profile) {
  const roleAttempt = await client.from("user_roles").insert({ profile_id: userId, role_id: "super_admin" });
  if (!roleAttempt.error) {
    await service.from("user_roles").delete().eq("profile_id", userId).eq("role_id", "super_admin");
    throw new Error(`Role escalation unexpectedly succeeded for ${userId}.`);
  }
  const profileAttempt = await client.from("profiles").update({ primary_role: "super_admin", role: "super_admin" }).eq("id", userId);
  if (!profileAttempt.error) {
    await service.from("profiles").update({ primary_role: profile.primary_role, role: profile.role }).eq("id", userId);
    throw new Error(`Profile escalation unexpectedly succeeded for ${userId}.`);
  }
  return "denied";
}

async function listAllUsers() {
  const users = [];
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 100) break;
  }
  return users;
}

function totp(secret) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = secret.replace(/=+$/u, "").toUpperCase();
  let bits = "";
  for (const character of clean) bits += alphabet.indexOf(character).toString(2).padStart(5, "0");
  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", Buffer.from(bytes)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}
