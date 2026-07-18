import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const workspaceRoot = path.resolve(appDir, "../..");
loadEnvConfig(workspaceRoot, true);

const expectedUrl = "https://rgcgtcycbiuhcaoaadbh.supabase.co";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.COLLECTION_PILOT_PASSWORD ?? process.env.HUB_PILOT_PASSWORD;
if (supabaseUrl !== expectedUrl || !serviceKey) throw new Error("Yobalelma Supabase service credentials are required.");
if (!password || password.length < 16) throw new Error("COLLECTION_PILOT_PASSWORD must contain at least 16 characters.");
const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const accounts = [
  { email: "pilot.collection-driver@yobalelma.test", name: "Ibrahima Diagne", role: "collection_driver" },
  { email: "pilot.collection-manager@yobalelma.test", name: "Fatou Ndiaye", role: "collection_manager" },
  { email: "pilot.collection-supervisor@yobalelma.test", name: "Awa Fall", role: "operations_manager" },
];
const users = new Map();
for (const account of accounts) {
  const user = await createOrUpdateUser(account); users.set(account.role, user);
  await assertResult(supabase.from("profiles").upsert({ id: user.id, account_status: "active", city: "Dakar", country: "Senegal", email: account.email, full_name: account.name, is_verified: true, preferred_language: "fr", primary_role: account.role, role: account.role }), "profile");
  await assertResult(supabase.from("user_roles").upsert({ profile_id: user.id, role_id: account.role }), "role assignment");
}
const denied = { email: "pilot.collection-denied@yobalelma.test", name: "Collection Access Denied", role: "client" };
const deniedUser = await createOrUpdateUser(denied);
await assertResult(supabase.from("profiles").upsert({ id: deniedUser.id, account_status: "active", city: "Dakar", country: "Senegal", email: denied.email, full_name: denied.name, is_verified: true, preferred_language: "fr", primary_role: denied.role, role: denied.role }), "denied profile");
await assertResult(supabase.from("user_roles").upsert({ profile_id: deniedUser.id, role_id: denied.role }), "denied role");

const driver = users.get("collection_driver"); const manager = users.get("collection_manager");
const vehicle = await upsertOne("collection_vehicles", { plate: "DK-7821-AC", model: "Mercedes Sprinter 319", vehicle_type: "van", capacity_kg: 1200, mileage_km: 84216, fuel_percent: 68, status: "ready", assigned_driver_id: driver.id, next_maintenance_km: 87500 }, "plate");
const relays = [];
for (const input of [
  { name: "Relais Collection Plateau", contact_name: "Moussa Ba", contact_phone: "+221700000101", address_line1: "12 avenue Léopold Sédar Senghor", city: "Dakar", country: "Senegal", capacity_slots: 120, status: "active" },
  { name: "Relais Collection Liberté 6", contact_name: "Aminata Cissé", contact_phone: "+221700000102", address_line1: "VDN Liberté 6", city: "Dakar", country: "Senegal", capacity_slots: 180, status: "active" },
  { name: "Relais Collection Parcelles", contact_name: "Ousmane Fall", contact_phone: "+221700000103", address_line1: "Unité 15 Parcelles Assainies", city: "Dakar", country: "Senegal", capacity_slots: 160, status: "active" },
]) relays.push(await findOrCreateRelay(input));

const today = new Date().toISOString().slice(0,10);
let { data: route, error: routeError } = await supabase.from("collection_routes").select("id").eq("driver_id", driver.id).eq("name", "Pilote Collection Dakar vers Hub DSS").maybeSingle();
if (routeError) throw routeError;
const routeValues = { driver_id: driver.id, created_by: manager.id, name: "Pilote Collection Dakar vers Hub DSS", route_date: today, status: "in_progress", vehicle_id: vehicle.id, route_kind: "relay_to_hub", optimized_distance_km: 31.8, estimated_duration_minutes: 96, optimization_metadata: { engine: "yobalelma-route-v1", saved_percent: 18 } };
if (route) { const result=await supabase.from("collection_routes").update(routeValues).eq("id",route.id).select("id").single(); if(result.error) throw result.error; route=result.data; }
else { const result=await supabase.from("collection_routes").insert(routeValues).select("id").single(); if(result.error) throw result.error; route=result.data; }
await assertResult(supabase.from("collection_route_stops").delete().eq("route_id", route.id), "old pilot stops");
await assertResult(supabase.from("collection_route_stops").insert(relays.map((relay,index)=>({ route_id:route.id,relay_point_id:relay.id,stop_order:index+1,status:index<2?"completed":index===2?"arrived":"pending",note:"Collection App pilot" }))), "pilot stops");

console.log(JSON.stringify({ accounts: accounts.map(({email,role})=>({email,role})), denied: {email:denied.email,role:denied.role}, fixtures: {routeId:route.id,vehicleId:vehicle.id,relayCount:relays.length}, ok:true }));

async function createOrUpdateUser(account) {
  const existing=await findUser(account.email); const attributes={ app_metadata:{yobalelma_collection_pilot:true}, email_confirm:true, password, user_metadata:{full_name:account.name,primary_role:account.role,yobalelma_collection_pilot:true} };
  const {data,error}=existing?await supabase.auth.admin.updateUserById(existing.id,attributes):await supabase.auth.admin.createUser({...attributes,email:account.email});
  if(error||!data.user) throw error??new Error(`User ${account.email} missing.`); return data.user;
}
async function findUser(email) { for(let page=1;page<=20;page+=1){const {data,error}=await supabase.auth.admin.listUsers({page,perPage:100});if(error)throw error;const user=data.users.find((item)=>item.email?.toLowerCase()===email);if(user||data.users.length<100)return user??null;}return null; }
async function findOrCreateRelay(values) { const found=await supabase.from("relay_points").select("id").eq("name",values.name).maybeSingle();if(found.error)throw found.error;if(found.data){const result=await supabase.from("relay_points").update(values).eq("id",found.data.id).select("id").single();if(result.error)throw result.error;return result.data;}const result=await supabase.from("relay_points").insert(values).select("id").single();if(result.error)throw result.error;return result.data; }
async function upsertOne(table,values,onConflict){const {data,error}=await supabase.from(table).upsert(values,{onConflict}).select("id").single();if(error)throw error;return data;}
async function assertResult(operation,label){const {error}=await operation;if(error)throw new Error(`${label}: ${error.message}`);}
