"use client";

import {useMemo,useRef,useState} from "react";
import {Crosshair,Expand,Layers3,Minus,Plus,Search,SquareMousePointer} from "lucide-react";

export type OperationalMapAsset={
  id:string;
  type:string;
  name:string;
  city:string;
  latitude:number;
  longitude:number;
  status:string;
  updatedAt?:string;
  details?:Array<{label:string;value:string}>;
};

const STALE_AFTER_MS=5*60*1000;

export function OperationalMap({assets,providerConfigured}:{assets:OperationalMapAsset[];providerConfigured:boolean}){
  const containerRef=useRef<HTMLElement>(null);
  const types=useMemo(()=>Array.from(new Set(assets.map((item)=>item.type))).sort(),[assets]);
  const [enabled,setEnabled]=useState<string[]>(types);
  const [query,setQuery]=useState("");
  const [zoom,setZoom]=useState(1);
  const [selected,setSelected]=useState<string[]>([]);
  const visible=useMemo(()=>assets.filter((item)=>enabled.includes(item.type)&&`${item.name} ${item.city} ${item.status}`.toLowerCase().includes(query.trim().toLowerCase())),[assets,enabled,query]);
  const markers=useMemo(()=>{
    const grouped=new Map<string,OperationalMapAsset[]>();
    const precision=zoom>=2?8:zoom>=1.5?4:2;
    for(const item of visible){
      const key=`${Math.round(item.latitude*precision)}:${Math.round(item.longitude*precision)}`;
      grouped.set(key,[...(grouped.get(key)??[]),item]);
    }
    return [...grouped.values()];
  },[visible,zoom]);
  const selectedAssets=assets.filter((item)=>selected.includes(item.id));
  const freshest=assets.reduce<string|undefined>((current,item)=>!item.updatedAt?current:!current||Date.parse(item.updatedAt)>Date.parse(current)?item.updatedAt:current,undefined);
  const staleCount=assets.filter((item)=>item.updatedAt&&Date.now()-Date.parse(item.updatedAt)>STALE_AFTER_MS).length;
  const toggle=(type:string)=>setEnabled((current)=>current.includes(type)?current.filter((item)=>item!==type):[...current,type]);
  const toggleSelected=(id:string)=>setSelected((current)=>current.includes(id)?current.filter((item)=>item!==id):[...current,id]);
  const enterFullscreen=async()=>{if(containerRef.current?.requestFullscreen)await containerRef.current.requestFullscreen();};

  return <section className="yb-panel overflow-hidden bg-background" ref={containerRef}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="yb-eyebrow">Carte opérationnelle</p><h2 className="text-2xl font-black">Réseau supervisé</h2><p className="mt-2 text-sm text-muted-foreground">{visible.length} actif(s) géolocalisé(s) réel(s) · regroupement spatial actif</p></div>
      <div className="flex flex-wrap items-center gap-2"><span className="yb-status" data-tone={staleCount?"warning":"success"}>{staleCount?`${staleCount} position(s) ancienne(s)`:"Positions à jour"}</span><span className="yb-status" data-tone={providerConfigured?"success":"warning"}>{providerConfigured?"Fond cartographique prêt":"Grille géographique de secours"}</span></div>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><span className="sr-only">Rechercher un actif</span><input className="yb-input min-h-10 w-full pl-9" onChange={(event)=>setQuery(event.target.value)} placeholder="Hub, relais, chauffeur…" value={query}/></label>
      <button className="yb-button-secondary min-h-10 px-3" onClick={()=>setZoom((value)=>Math.max(1,value-.5))} type="button" aria-label="Réduire le zoom"><Minus className="h-4 w-4"/></button><span className="yb-status">x{zoom.toFixed(1)}</span><button className="yb-button-secondary min-h-10 px-3" onClick={()=>setZoom((value)=>Math.min(3,value+.5))} type="button" aria-label="Augmenter le zoom"><Plus className="h-4 w-4"/></button>
      <button className="yb-button-secondary min-h-10 px-3" onClick={enterFullscreen} type="button"><Expand className="mr-2 inline h-4 w-4"/>Plein écran</button>
    </div>
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Couches cartographiques"><Layers3 className="mt-2 h-4 w-4 text-muted-foreground"/>{types.map((type)=><button aria-pressed={enabled.includes(type)} className={`rounded-full border px-3 py-1.5 text-xs font-black ${enabled.includes(type)?"bg-foreground text-background":"bg-background"}`} key={type} onClick={()=>toggle(type)} type="button">{type}</button>)}</div>
    <div className="relative mt-4 h-[430px] overflow-hidden rounded-2xl border bg-[radial-gradient(circle_at_center,hsl(var(--muted))_1px,transparent_1px)] bg-[size:24px_24px]" role="application" aria-label="Carte des opérations">
      <div className="absolute inset-0 opacity-30" style={{backgroundImage:"linear-gradient(to right,transparent 49.8%,currentColor 50%,transparent 50.2%),linear-gradient(to bottom,transparent 49.8%,currentColor 50%,transparent 50.2%)"}}/>
      {markers.map((cluster)=>{const first=cluster[0];if(!first)return null;const left=Math.max(2,Math.min(98,(first.longitude+180)/360*100));const top=Math.max(2,Math.min(98,(90-first.latitude)/180*100));const active=cluster.some((item)=>selected.includes(item.id));return <button aria-label={`${cluster.length} ${first.type}: ${first.name}`} aria-pressed={active} className={`absolute grid min-h-9 min-w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 px-2 text-xs font-black shadow-lg transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${active?"border-primary bg-foreground text-background":"border-background bg-primary text-primary-foreground"}`} key={`${first.id}-${cluster.length}`} onClick={()=>cluster.forEach((item)=>toggleSelected(item.id))} style={{left:`${left}%`,top:`${top}%`,transform:`translate(-50%,-50%) scale(${Math.min(1.35,zoom)})`}} type="button">{cluster.length>1?cluster.length:<Crosshair className="h-4 w-4"/>}</button>})}
      {!markers.length?<div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">Aucun actif réel ne correspond aux couches et à la recherche.</div>:null}
      <div className="absolute bottom-3 left-3 rounded-lg border bg-background/95 px-3 py-2 text-xs font-bold shadow-sm">Latitude / longitude · aucune position inventée</div>
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{freshest?`Dernière donnée reçue ${freshness(freshest)}`:"Fraîcheur indisponible"}</span><span><SquareMousePointer className="mr-1 inline h-3.5 w-3.5"/>{selected.length} sélection(s)</span></div>
    {selectedAssets.length?<div className="mt-3 grid gap-3 lg:grid-cols-2">{selectedAssets.slice(0,6).map((item)=><article className="rounded-xl border bg-muted/30 p-4" key={item.id}><div className="flex items-start justify-between gap-3"><div><strong>{item.type} · {item.name}</strong><p className="mt-1 text-sm text-muted-foreground">{item.city||"Ville non renseignée"} · {item.status}</p></div><button aria-label={`Retirer ${item.name} de la sélection`} className="text-xs font-black underline" onClick={()=>toggleSelected(item.id)} type="button">Retirer</button></div><dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-muted-foreground">Position</dt><dd className="font-mono">{item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</dd></div><div><dt className="text-muted-foreground">Fraîcheur</dt><dd>{item.updatedAt?freshness(item.updatedAt):"Indisponible"}</dd></div>{item.details?.map((detail)=><div key={detail.label}><dt className="text-muted-foreground">{detail.label}</dt><dd className="font-bold">{detail.value||"—"}</dd></div>)}</dl></article>)}</div>:null}
    {!providerConfigured?<p className="mt-3 text-xs text-muted-foreground">Le fond routier, le trafic et les ETA restent désactivés jusqu’à l’activation d’un fournisseur cartographique officiel. La grille conserve la recherche, les couches, le zoom, le regroupement et la sélection sur les coordonnées réelles.</p>:null}
  </section>;
}

function freshness(value:string){const timestamp=Date.parse(value);if(!Number.isFinite(timestamp))return "indisponible";const seconds=Math.max(0,Math.round((Date.now()-timestamp)/1000));if(seconds<60)return `il y a ${seconds} s`;const minutes=Math.round(seconds/60);if(minutes<60)return `il y a ${minutes} min`;return `il y a ${Math.round(minutes/60)} h`;}
