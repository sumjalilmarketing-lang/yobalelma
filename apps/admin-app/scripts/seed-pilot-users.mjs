import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { loadPilotCredentials, passwordFor } from "../../../scripts/pilot-credentials.mjs";

const { loadEnvConfig } = nextEnv;
const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
loadEnvConfig(path.resolve(appDir, "../.."), true);
const expected = "https://rgcgtcycbiuhcaoaadbh.supabase.co";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url !== expected || !key) throw new Error("Yobalelma service credentials are required.");
const credentialBundle = await loadPilotCredentials(path.resolve(appDir, "../.."));
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const accounts = [
  { email: "pilot.command@yobalelma.test", name: "Awa Ndiaye", role: "super_admin", direction: "executive", service: "platform_governance" },
  { email: "pilot.admin@yobalelma.test", name: "Mame Diop", role: "admin", direction: "executive", service: "platform_governance" },
  { email: "pilot.country-sn@yobalelma.test", name: "Alioune Ndiaye", role: "country_manager", direction: "executive", service: "platform_governance" },
  { email: "pilot.operations@yobalelma.test", name: "Moussa Fall", role: "operations_manager", direction: "operations", service: "central_operations" },
  { email: "pilot.admin-hub@yobalelma.test", name: "Aminata Ba", role: "hub_manager", direction: "operations", service: "hub_operations" },
  { email: "pilot.admin-relay@yobalelma.test", name: "Ousmane Sow", role: "relay_manager", direction: "operations", service: "relay_operations" },
  { email: "pilot.admin-collection@yobalelma.test", name: "Khady Kane", role: "collection_manager", direction: "operations", service: "collection_operations" },
  { email: "pilot.local-delivery@yobalelma.test", name: "Ibrahima Faye", role: "local_delivery_manager", direction: "operations", service: "local_delivery" },
  { email: "pilot.travelers@yobalelma.test", name: "Fatou Sarr", role: "traveler_manager", direction: "travelers", service: "traveler_management" },
  { email: "pilot.customs@yobalelma.test", name: "Mamadou Ba", role: "customs_manager", direction: "customs", service: "customs_operations" },
  { email: "pilot.compliance@yobalelma.test", name: "Ibrahima Ba", role: "compliance_manager", direction: "customs", service: "compliance" },
  { email: "pilot.finance@yobalelma.test", name: "Mariama Diallo", role: "finance_manager", direction: "finance", service: "finance_control" },
  { email: "pilot.support@yobalelma.test", name: "Khady Diop", role: "customer_support_manager", direction: "customer_service", service: "customer_support" },
  { email: "pilot.security@yobalelma.test", name: "Ousmane Kane", role: "security_manager", direction: "security", service: "security_control" },
  { email: "pilot.auditor@yobalelma.test", name: "Sokhna Fall", role: "auditor", direction: "security", service: "internal_audit" },
];
const { data: organization, error: organizationError } = await supabase.from("governance_organizations").select("id").eq("code", "YB-SN").single();
if (organizationError) throw organizationError;
for (const account of accounts) {
  const user = await createOrUpdateUser(account);
  await ok(supabase.from("profiles").upsert({ id: user.id, account_status: "active", city: "Dakar", country: "Senegal", email: account.email, full_name: account.name, is_verified: true, preferred_language: "fr", primary_role: baseRole(account.role), role: baseRole(account.role) }), "profile");
  await ok(supabase.from("user_roles").upsert({ profile_id: user.id, role_id: account.role }), "role");
  const assignment = { profile_id: user.id, display_name: account.name, email: account.email, role_id: account.role, direction_id: account.direction, service_id: account.service, country_code: "SN", region_code: "DK", organization_id: organization.id, active: true };
  const { data: existing, error: existingError } = await supabase.from("governance_staff_assignments").select("id").eq("profile_id", user.id).eq("role_id", account.role).eq("active", true).maybeSingle();
  if (existingError) throw existingError;
  await ok(existing ? supabase.from("governance_staff_assignments").update(assignment).eq("id", existing.id) : supabase.from("governance_staff_assignments").insert(assignment), "assignment");
}
console.log(JSON.stringify({ ok: true, accounts: accounts.map(({ email, role }) => ({ email, role })), directions: 8 }));

function baseRole(role) { return ["super_admin", "admin", "operations_manager", "hub_manager", "hub_supervisor", "hub_agent", "relay_manager", "relay_agent", "collection_manager", "collection_driver", "finance_agent", "support_agent"].includes(role) ? role : "client"; }
async function createOrUpdateUser(account) { const existing = await findUser(account.email); const attrs = { app_metadata: { yobalelma_admin_pilot: true }, email_confirm: true, password: passwordFor(credentialBundle, account.email), user_metadata: { full_name: account.name, password_change_required: true } }; const { data, error } = existing ? await supabase.auth.admin.updateUserById(existing.id, attrs) : await supabase.auth.admin.createUser({ ...attrs, email: account.email }); if (error || !data.user) throw error ?? new Error("User missing"); return data.user; }
async function findUser(email) { for (let page = 1; page <= 20; page += 1) { const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 }); if (error) throw error; const user = data.users.find((item) => item.email?.toLowerCase() === email); if (user || data.users.length < 100) return user ?? null; } return null; }
async function ok(operation, label) { const { error } = await operation; if (error) throw new Error(`${label}: ${error.message}`); }
