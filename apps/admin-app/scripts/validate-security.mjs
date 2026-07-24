import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
loadEnvConfig(path.resolve(appDir, "../.."), true);
const expected = "https://rgcgtcycbiuhcaoaadbh.supabase.co";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.ADMIN_SECURITY_PASSWORD;
if (url !== expected || !publicKey || !serviceKey || !password) throw new Error("Yobalelma security validation credentials are required.");
const service = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const superAdmin = await signedIn("pilot.command@yobalelma.test");
const finance = await signedIn("pilot.finance@yobalelma.test");
const hubAgent = await signedIn("pilot.hub-agent.command@yobalelma.test");
const directions = await superAdmin.from("governance_directions").select("id");
assert(!directions.error && directions.data.length === 8, "direction catalog");
const financeForeign = await finance.from("governance_missions").select("id").eq("service_id", "central_operations");
assert(!financeForeign.error && financeForeign.data.length === 0, "finance isolation");
const { data: agentUser } = await hubAgent.auth.getUser();
const deniedMission = await hubAgent.from("governance_missions").insert({ reference: `YB-DENIED-${Date.now()}`, workflow_key: "operations_standard", direction_id: "operations", service_id: "hub_operations", title: "Vérification refus attendue", description: "Cette création directe par un agent doit être refusée.", status: "draft", priority: "normal", creator_id: agentUser.user.id, creator_name: "Agent test", country_code: "SN" });
assert(Boolean(deniedMission.error), "agent mission creation denial");
const { data: financeUser } = await finance.auth.getUser();
const invalidAssignment = await service.from("governance_staff_assignments").insert({ profile_id: financeUser.user.id, display_name: "Test invalide", email: "invalid.assignment@yobalelma.test", role_id: "finance_manager", direction_id: "operations", service_id: "hub_operations", country_code: "SN", active: true });
assert(Boolean(invalidAssignment.error), "role service mismatch denial");
const { data: mission } = await service.from("governance_missions").select("id,status").eq("status", "draft").limit(1).maybeSingle();
if (mission) {
  const invalidTransition = await service.from("governance_missions").update({ status: "closed" }).eq("id", mission.id);
  assert(Boolean(invalidTransition.error), "workflow bypass denial");
}
console.log(JSON.stringify({ ok: true, checks: ["eight direction catalog", "finance service isolation", "agent create denial", "automatic role-service enforcement", "workflow transition enforcement"] }));

async function signedIn(email) { const client = createClient(url, publicKey, { auth: { autoRefreshToken: false, persistSession: false } }); const { error } = await client.auth.signInWithPassword({ email, password }); if (error) throw error; return client; }
function assert(condition, label) { if (!condition) throw new Error(`Security check failed: ${label}`); }
