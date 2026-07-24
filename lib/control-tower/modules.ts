export const controlTowerModules = [
  { id:"core",label:"Control Tower Core",dependencies:[],external:false },
  { id:"operations",label:"Operations Center",dependencies:["core"],external:false },
  { id:"dispatch",label:"Dispatch Engine",dependencies:["core","driver_tracking"],external:false },
  { id:"fleet",label:"Fleet Management",dependencies:["core"],external:false },
  { id:"driver_tracking",label:"Driver Tracking",dependencies:["core"],external:false },
  { id:"hubs",label:"Hub Monitoring",dependencies:["core"],external:false },
  { id:"relays",label:"Relay Monitoring",dependencies:["core"],external:false },
  { id:"shipments",label:"Shipment Intelligence",dependencies:["core"],external:false },
  { id:"incidents",label:"Incident Center",dependencies:["core","notifications"],external:false },
  { id:"notifications",label:"Notification Center",dependencies:["core"],external:true },
  { id:"executive",label:"Executive Dashboard",dependencies:["core","analytics"],external:false },
  { id:"partners",label:"Partner Dashboard",dependencies:["core"],external:true },
  { id:"analytics",label:"Business Intelligence",dependencies:["core"],external:false },
  { id:"recommendations",label:"AI Recommendation Engine",dependencies:["core","digital_twin"],external:false },
  { id:"digital_twin",label:"Digital Twin",dependencies:["core"],external:false },
  { id:"audit",label:"Audit & Compliance",dependencies:["core"],external:false },
] as const;
export type ControlTowerModuleId=(typeof controlTowerModules)[number]["id"];

export function validateModuleGraph(){
  const ids=new Set(controlTowerModules.map((entry)=>entry.id));
  for(const entry of controlTowerModules) for(const dependency of entry.dependencies) if(!ids.has(dependency)) throw new Error(`Unknown dependency ${dependency}`);
  return true;
}
