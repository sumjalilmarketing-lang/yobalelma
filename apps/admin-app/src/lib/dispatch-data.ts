import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminSession } from "./types";

const roles = ["super_admin", "admin", "operations_manager", "dispatch_manager", "security_manager", "auditor"];
export function canAccessDispatch(session: AdminSession) { return session.roleIds.some((role) => roles.includes(role)); }
export async function loadDispatchData(session: AdminSession) {
  if (!canAccessDispatch(session)) return null; const supabase = await tryCreateSupabaseServerClient(); const mapConfigured = Boolean(process.env.MAP_PROVIDER && process.env.MAP_PROVIDER_GATEWAY_URL && process.env.MAP_PROVIDER_SERVER_TOKEN);
  if (!supabase) return { mapConfigured, sourceReady: false, missions: [], positions: [], driverStates:[], trackingAlerts:[], relays: [], hubs: [], recommendations: [], rules: [], incidents: [] };
  const db = supabase as SupabaseClient; const results = await Promise.all([
    db.from("local_delivery_missions").select("id,shipment_id,transporter_id,status,score,reason,offered_at,accepted_at,updated_at,shipments(tracking_code,origin_city,destination_city,status)").order("updated_at", { ascending: false }).limit(250),
    db.from("operational_live_positions").select("profile_id,position_event_id,mission_id,collection_route_id,vehicle_id,latitude,longitude,accuracy_meters,speed_kph,battery_percent,network_status,location_status,recorded_at,received_at,expires_at").order("recorded_at", { ascending: false }).limit(500),
    db.from("driver_operational_states").select("profile_id,status,active_mission_id,collection_route_id,vehicle_id,last_transition_at,updated_at").order("updated_at",{ascending:false}).limit(500),
    db.from("operational_tracking_alerts").select("id,profile_id,mission_id,collection_route_id,alert_type,severity,status,detected_at,assigned_to").in("status",["open","qualified","assigned"]).order("detected_at",{ascending:false}).limit(250),
    db.from("relay_points").select("id,name,city,country,latitude,longitude,status,capacity_slots,availability,last_synced_at").eq("status", "active").limit(500),
    db.from("airport_hubs").select("id,name,city,country,latitude,longitude,is_active").eq("is_active", true).limit(200),
    db.from("dispatch_recommendations").select("id,mission_id,candidate_profile_id,rank,score,distance_meters,duration_seconds,route_source,reasons,confidence,requires_human_approval,status,generated_at,expires_at").order("generated_at", { ascending: false }).limit(300),
    db.from("dispatch_rule_sets").select("id,country_code,city,version,name,status,mode,effective_from,approved_at").order("created_at", { ascending: false }).limit(100),
    db.from("operational_incidents").select("id,title,priority,status,created_at").in("status", ["open", "investigating"]).order("created_at", { ascending: false }).limit(100),
  ]);
  return { mapConfigured, sourceReady: results.every((item) => !item.error), missions: results[0].data ?? [], positions: results[1].data ?? [], driverStates:results[2].data??[],trackingAlerts:results[3].data??[],relays: results[4].data ?? [], hubs: results[5].data ?? [], recommendations: results[6].data ?? [], rules: results[7].data ?? [], incidents: results[8].data ?? [] };
}
