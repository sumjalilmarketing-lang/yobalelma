import "server-only";
import type {SupabaseClient} from "@supabase/supabase-js";
import {tryCreateSupabaseServerClient} from "@/lib/supabase/server";
import {calculateNetworkHealth,prioritizeAttention,type TowerKpis} from "@/lib/control-tower/core";
import {generateOperationalRecommendations} from "@/lib/control-tower/recommendations";
import type {AdminSession} from "./types";

const accessRoles=["super_admin","admin","country_manager","operations_manager","dispatch_manager","hub_manager","relay_manager","collection_manager","local_delivery_manager","traveler_manager","customs_manager","compliance_manager","finance_manager","customer_support_manager","security_manager","auditor","partner_manager","orange_partner_manager"];
export function canAccessControlTower(session:AdminSession){return session.roleIds.some((role)=>accessRoles.includes(role));}
export type TowerView="supervision"|"intelligence"|"dispatch"|"executive"|"finance"|"support"|"partner"|"customs"|"operations";
export function allowedTowerViews(session:AdminSession):TowerView[]{const roles=session.roleIds;if(roles.some((r)=>["super_admin","admin","country_manager","auditor"].includes(r)))return ["supervision","intelligence","dispatch","executive","finance","support","partner","customs","operations"];if(roles.some((r)=>r.startsWith("finance")||["accounting_agent","payment_agent","reconciliation_agent"].includes(r)))return ["finance"];if(roles.some((r)=>r.includes("customs")||r.includes("compliance")))return ["customs"];if(roles.some((r)=>r.includes("support")))return ["support"];if(roles.some((r)=>r.includes("partner")||r.includes("orange")))return ["partner"];if(roles.some((r)=>r.includes("dispatch")))return ["intelligence","dispatch","operations","supervision"];return ["intelligence","supervision","operations"];}
export function defaultTowerView(session:AdminSession):TowerView{const allowed=allowedTowerViews(session);return allowed.includes("executive")?"executive":allowed[0]??"supervision";}

export async function loadControlTowerData(session:AdminSession,filters:{country?:string;view?:string;from?:string;to?:string}={}){
  if(!canAccessControlTower(session))return null;
  const country=filters.country?.toUpperCase(); const unrestricted=session.roleIds.some((role)=>["super_admin","admin","auditor"].includes(role));
  const assignedCountries=new Set(session.assignments.map((item)=>item.countryCode).filter(Boolean));
  if(country&&!unrestricted&&!assignedCountries.has(country))return null;
  const client=await tryCreateSupabaseServerClient(); const mapConfigured=Boolean(process.env.MAP_PROVIDER&&process.env.MAP_PROVIDER_GATEWAY_URL&&process.env.MAP_PROVIDER_SERVER_TOKEN);
  if(!client)return empty(mapConfigured,defaultTowerView(session),allowedTowerViews(session),country);
  const db=client as SupabaseClient;
  const queryCountry=<T extends {eq:(column:string,value:string)=>T}>(query:T,column:string)=>country?query.eq(column,country):query;
  let eventQuery=db.from("control_tower_events").select("id,source_module,source_event_id,event_type,entity_type,entity_id,country_code,occurred_at,severity,correlation_id").order("occurred_at",{ascending:false}).limit(1000);
  if(country)eventQuery=eventQuery.eq("country_code",country); if(filters.from)eventQuery=eventQuery.gte("occurred_at",filters.from); if(filters.to)eventQuery=eventQuery.lte("occurred_at",filters.to);
  const results=await Promise.all([
    queryCountry(db.from("shipments").select("id,status,origin_country,destination_country,origin_city,destination_city,updated_at").limit(2000),"origin_country"),
    db.from("local_delivery_missions").select("id,shipment_id,transporter_id,status,updated_at").limit(2000),
    queryCountry(db.from("operational_incidents").select("id,incident_code,incident_type,status,priority,country_code,city,title,assigned_to,created_at,updated_at").order("created_at",{ascending:false}).limit(500),"country_code"),
    db.from("operational_tracking_alerts").select("id,profile_id,alert_type,severity,status,detected_at").in("status",["open","qualified","assigned"]).limit(500),
    db.from("driver_operational_states").select("profile_id,status,active_mission_id,collection_route_id,vehicle_id,updated_at").limit(1000),
    db.from("operational_live_positions").select("profile_id,mission_id,collection_route_id,vehicle_id,latitude,longitude,accuracy_meters,location_status,recorded_at,expires_at").limit(1000),
    queryCountry(db.from("airport_hubs").select("id,name,city,country,latitude,longitude,is_active").limit(500),"country"),
    queryCountry(db.from("relay_points").select("id,name,city,country,latitude,longitude,status,capacity_slots,availability").limit(1000),"country"),
    queryCountry(db.from("payments").select("id,status,country_code,amount,currency,updated_at").limit(1000),"country_code"),
    queryCountry(db.from("customs_cases").select("id,status,country_scope,shipment_id,updated_at").limit(1000),"country_scope"),
    db.from("notification_deliveries").select("id,status,channel,provider,created_at").in("status",["queued","failed"]).limit(1000),
    queryCountry(db.from("digital_twin_entities").select("id,entity_type,entity_id,country_code,city,operational_status,latitude,longitude,capacity_used,capacity_total,observed_at").limit(2000),"country_code"),
    queryCountry(db.from("control_tower_recommendations").select("id,module,recommendation_type,entity_type,entity_id,priority,title,explanation,evidence,alternatives,confidence,status,generated_at,expires_at,country_code,requires_human_approval,decision_reason").order("generated_at",{ascending:false}).limit(250),"country_code"),
    queryCountry(db.from("control_tower_module_health").select("module,country_code,status,last_success_at,last_failure_at,latency_p95_ms,backlog_count,dependencies,updated_at").limit(250),"country_code"),
    eventQuery,
    db.from("hub_capacities").select("hub_id,capacity_date,storage_weight_capacity_kg,reserved_weight_kg").gte("capacity_date",new Date().toISOString().slice(0,10)).limit(500),
    queryCountry(db.from("governance_staff_assignments").select("profile_id,country_code").eq("active",true).limit(5000),"country_code"),
  ]);
  const [shipments,missions,incidents,trackingAlerts,driverStates,positions,hubs,relays,payments,customs,notifications,twins,storedRecommendations,moduleHealth,events,capacities,staffAssignments]=results.map((result)=>result.data??[]) as Array<Array<Record<string,unknown>>>;
  const shipmentIds=new Set(shipments.map((row)=>row.id)); const profileIds=new Set(staffAssignments.map((row)=>row.profile_id));
  const scopedMissions=country?missions.filter((row)=>shipmentIds.has(row.shipment_id)):missions; const scopedStates=country?driverStates.filter((row)=>profileIds.has(row.profile_id)):driverStates; const scopedPositions=country?positions.filter((row)=>profileIds.has(row.profile_id)):positions; const scopedAlerts=country?trackingAlerts.filter((row)=>profileIds.has(row.profile_id)):trackingAlerts;
  const activeMissions=scopedMissions.filter((row)=>["offered","accepted","picked_up"].includes(String(row.status))); const liveIds=new Set(scopedPositions.filter((row)=>Date.parse(String(row.expires_at))>Date.now()).map((row)=>row.profile_id));
  const activeDrivers=scopedStates.filter((row)=>!["offline","available","unavailable","mission_completed","paused"].includes(String(row.status)));
  const capacityTotal=capacities.reduce((sum,row)=>sum+Number(row.storage_weight_capacity_kg||0),0); const capacityUsed=capacities.reduce((sum,row)=>sum+Number(row.reserved_weight_kg||0),0);
  const kpis:TowerKpis={activeShipments:shipments.filter((row)=>!["delivered","cancelled"].includes(String(row.status))).length,activeMissions:activeMissions.length,openIncidents:incidents.filter((row)=>!["resolved","closed"].includes(String(row.status))).length,criticalAlerts:scopedAlerts.filter((row)=>row.severity==="critical").length,onlineDrivers:activeDrivers.filter((row)=>liveIds.has(row.profile_id)).length,staleDrivers:activeDrivers.filter((row)=>!liveIds.has(row.profile_id)).length,hubCapacityPercent:capacityTotal?Math.round(capacityUsed/capacityTotal*100):0,paymentExceptions:payments.filter((row)=>["failed","expired","refund_pending"].includes(String(row.status))).length,customsBlocked:customs.filter((row)=>["rejected","suspended","seized","additional_information_required","inspection_required"].includes(String(row.status))).length,notificationBacklog:country?0:notifications.length};
  const health=calculateNetworkHealth(kpis); const derivedRecommendations=generateOperationalRecommendations(kpis);
  const sourceReady=results.every((result)=>!result.error); const allowedViews=allowedTowerViews(session); const view=(filters.view&&allowedViews.includes(filters.view as TowerView)?filters.view:defaultTowerView(session)) as TowerView;
  const freshness=[
    source("Événements",events,"occurred_at",results[14]?.error),source("Expéditions",shipments,"updated_at",results[0]?.error),source("Missions",scopedMissions,"updated_at",results[1]?.error),source("Positions GPS",scopedPositions,"recorded_at",results[5]?.error),source("Incidents",incidents,"updated_at",results[2]?.error),source("Digital Twin",twins,"observed_at",results[11]?.error),
  ];
  return {sourceReady,mapConfigured,country:country??null,view,allowedViews,kpis,health,attention:prioritizeAttention(kpis),freshness,incidents,trackingAlerts:scopedAlerts,driverStates:scopedStates,positions:scopedPositions,hubs,relays,shipments:shipments.slice(0,250),missions:scopedMissions.slice(0,250),payments:payments.slice(0,250),customs:customs.slice(0,250),notifications:(country?[]:notifications).slice(0,250),twins,storedRecommendations,derivedRecommendations,moduleHealth,events,external:{maps:mapConfigured,orangeMoney:process.env.ORANGE_MONEY_ENV==="production",notifications:Boolean(process.env.NOTIFICATION_PROVIDER),whatsapp:Boolean(process.env.WHATSAPP_ACCESS_TOKEN)}};
}
function empty(mapConfigured:boolean,view:TowerView,allowedViews:TowerView[],country?:string){const kpis:TowerKpis={activeShipments:0,activeMissions:0,openIncidents:0,criticalAlerts:0,onlineDrivers:0,staleDrivers:0,hubCapacityPercent:0,paymentExceptions:0,customsBlocked:0,notificationBacklog:0};return {sourceReady:false,mapConfigured,country:country??null,view,allowedViews,kpis,health:calculateNetworkHealth(kpis),attention:[],freshness:["Événements","Expéditions","Missions","Positions GPS","Incidents","Digital Twin"].map((name)=>({name,status:"unavailable" as const,updatedAt:null,count:0})),incidents:[],trackingAlerts:[],driverStates:[],positions:[],hubs:[],relays:[],shipments:[],missions:[],payments:[],customs:[],notifications:[],twins:[],storedRecommendations:[],derivedRecommendations:[],moduleHealth:[],events:[],external:{maps:mapConfigured,orangeMoney:false,notifications:false,whatsapp:false}};}
function source(name:string,rows:Array<Record<string,unknown>>,field:string,error:unknown){const timestamps=rows.map((row)=>Date.parse(String(row[field]??""))).filter(Number.isFinite);const updatedAt=timestamps.length?new Date(Math.max(...timestamps)).toISOString():null;const age=updatedAt?Date.now()-Date.parse(updatedAt):Number.POSITIVE_INFINITY;return {name,count:rows.length,updatedAt,status:error?"unavailable" as const:!updatedAt?"delayed" as const:age>15*60*1000?"delayed" as const:"realtime" as const};}
