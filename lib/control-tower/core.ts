import {z} from "zod";

const allowedPayloadKeys=new Set(["operational_status","city","latitude","longitude","capacity_used","capacity_total","priority","risk_level","shipment_id","assigned_to","vehicle_id","active_mission_id","eta_seconds","progress_percent","source_record_id","reason_code","metric","value"]);
export function sanitizeControlTowerPayload(payload:Record<string,unknown>){return Object.fromEntries(Object.entries(payload).filter(([key])=>allowedPayloadKeys.has(key)));}
export const controlEventSchema=z.object({sourceModule:z.string().min(2).max(80),sourceEventId:z.string().min(1).max(200),eventType:z.string().min(2).max(120),entityType:z.string().min(2).max(80),entityId:z.string().min(1).max(200),countryCode:z.string().length(2).transform((v)=>v.toUpperCase()),regionCode:z.string().max(40).nullable().optional(),occurredAt:z.string().datetime({offset:true}),severity:z.enum(["info","warning","critical"]).default("info"),sanitizedPayload:z.record(z.string(),z.unknown()).default({}).transform(sanitizeControlTowerPayload),correlationId:z.string().uuid().nullable().optional()});
export type ControlEvent=z.infer<typeof controlEventSchema>;

export type TowerKpis={activeShipments:number;activeMissions:number;openIncidents:number;criticalAlerts:number;onlineDrivers:number;staleDrivers:number;hubCapacityPercent:number;paymentExceptions:number;customsBlocked:number;notificationBacklog:number};
export function calculateNetworkHealth(kpis:TowerKpis){
  const reasons:string[]=[]; let score=100;
  if(kpis.criticalAlerts){score-=Math.min(35,kpis.criticalAlerts*7);reasons.push(`${kpis.criticalAlerts} alerte(s) critique(s)`);}
  if(kpis.openIncidents){score-=Math.min(25,kpis.openIncidents*3);reasons.push(`${kpis.openIncidents} incident(s) ouvert(s)`);}
  if(kpis.staleDrivers){score-=Math.min(20,kpis.staleDrivers*2);reasons.push(`${kpis.staleDrivers} position(s) terrain ancienne(s)`);}
  if(kpis.hubCapacityPercent>=90){score-=20;reasons.push("Capacité Hub critique");} else if(kpis.hubCapacityPercent>=75){score-=10;reasons.push("Capacité Hub à surveiller");}
  if(kpis.paymentExceptions){score-=Math.min(15,kpis.paymentExceptions*2);reasons.push("Exceptions de paiement");}
  if(kpis.customsBlocked){score-=Math.min(15,kpis.customsBlocked*2);reasons.push("Expéditions bloquées en douane");}
  const bounded=Math.max(0,score); return {score:bounded,status:bounded>=85?"nominal" as const:bounded>=60?"degraded" as const:"critical" as const,reasons};
}

export function prioritizeAttention(kpis:TowerKpis){return [
  {key:"critical_alerts",label:"Alertes critiques",value:kpis.criticalAlerts,weight:25},
  {key:"incidents",label:"Incidents ouverts",value:kpis.openIncidents,weight:8},
  {key:"customs",label:"Blocages douaniers",value:kpis.customsBlocked,weight:7},
  {key:"payments",label:"Exceptions de paiement",value:kpis.paymentExceptions,weight:7},
  {key:"stale_drivers",label:"Signaux GPS anciens",value:kpis.staleDrivers,weight:6},
].filter((item)=>item.value>0).sort((a,b)=>b.value*b.weight-a.value*a.weight);}
