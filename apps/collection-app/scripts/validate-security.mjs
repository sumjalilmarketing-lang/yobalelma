import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv; const appDir=path.dirname(path.dirname(fileURLToPath(import.meta.url))); const root=path.resolve(appDir,"../.."); loadEnvConfig(root,true);
const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY; const password=process.env.COLLECTION_PILOT_PASSWORD;
if(url!=="https://rgcgtcycbiuhcaoaadbh.supabase.co"||!key||!serviceKey||!password)throw new Error("Collection security credentials missing.");
const client=()=>createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}}); const service=createClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}});
const driver=client(); const manager=client(); const denied=client(); const anonymous=client();
await signIn(driver,"pilot.collection-driver@yobalelma.test"); await signIn(manager,"pilot.collection-manager@yobalelma.test"); await signIn(denied,"pilot.collection-denied@yobalelma.test");
const driverUser=(await driver.auth.getUser()).data.user; const managerUser=(await manager.auth.getUser()).data.user; if(!driverUser||!managerUser)throw new Error("Pilot identities unavailable.");
const driverRoutes=await driver.from("collection_routes").select("id,driver_id,name"); assert(!driverRoutes.error&&driverRoutes.data?.length===1&&driverRoutes.data.every((route)=>route.driver_id===driverUser.id),"driver sees only assigned routes");
const routeId=driverRoutes.data[0].id; const managerRoutes=await manager.from("collection_routes").select("id"); assert(!managerRoutes.error&&(managerRoutes.data?.length??0)>=1,"manager sees collection routes");
const deniedRoutes=await denied.from("collection_routes").select("id"); assert(!deniedRoutes.error&&deniedRoutes.data?.length===0,"client sees no routes"); const anonRoutes=await anonymous.from("collection_routes").select("id"); assert(!anonRoutes.error&&anonRoutes.data?.length===0,"anonymous sees no routes");
const gps=await driver.rpc("record_collection_gps",{p_route_id:routeId,p_latitude:14.7643,p_longitude:-17.4324,p_accuracy_meters:7,p_speed_kph:0,p_heading_degrees:90}); assert(!gps.error&&gps.data,"assigned driver records GPS");
const foreignGps=await driver.rpc("record_collection_gps",{p_route_id:crypto.randomUUID(),p_latitude:14.7,p_longitude:-17.4}); assert(Boolean(foreignGps.error),"foreign route GPS rejected");
const directRouteWrite=await driver.from("collection_routes").update({name:"unauthorized"}).eq("id",routeId).select("id"); assert(!directRouteWrite.error&&directRouteWrite.data?.length===0,"driver cannot change assignment");
const opId=`security-${Date.now()}`; const offlineInsert=await driver.from("collection_offline_operations").insert({driver_id:driverUser.id,device_operation_id:opId,operation_type:"scan",payload:{tracking_code:"SECURITY-TEST"},status:"pending"}).select("id").single(); assert(!offlineInsert.error&&offlineInsert.data,"driver appends own offline action");
const duplicate=await driver.from("collection_offline_operations").insert({driver_id:driverUser.id,device_operation_id:opId,operation_type:"scan",payload:{tracking_code:"SECURITY-TEST"},status:"pending"}); assert(Boolean(duplicate.error),"offline duplicate rejected");
const deniedOffline=await denied.from("collection_offline_operations").insert({driver_id:(await denied.auth.getUser()).data.user.id,device_operation_id:`denied-${Date.now()}`,operation_type:"scan",payload:{},status:"pending"}); assert(Boolean(deniedOffline.error),"client offline write rejected");
const managerUpdate=await manager.from("collection_offline_operations").update({status:"applied",applied_at:new Date().toISOString()}).eq("id",offlineInsert.data.id).select("id").single(); assert(!managerUpdate.error,"manager resolves offline action");
await service.from("collection_offline_operations").delete().eq("id",offlineInsert.data.id);
console.log(JSON.stringify({ok:true,checks:["real auth roles","driver route isolation","manager visibility","client and anonymous denial","GPS RPC ownership","direct assignment denial","offline idempotency","manager conflict resolution"],routeId}));
async function signIn(instance,email){const {error}=await instance.auth.signInWithPassword({email,password});if(error)throw new Error(`${email}: ${error.message}`);} function assert(value,label){if(!value)throw new Error(`Security check failed: ${label}`);}
