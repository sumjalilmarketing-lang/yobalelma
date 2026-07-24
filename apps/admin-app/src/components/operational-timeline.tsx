"use client";

import {useEffect,useMemo,useState} from "react";
import {ChevronLeft,ChevronRight,Pause,Play,Search} from "lucide-react";

type TimelineEvent=Record<string,unknown>;

export function OperationalTimeline({events}:{events:TimelineEvent[]}){
  const ordered=useMemo(()=>[...events].sort((a,b)=>Date.parse(String(a.occurred_at))-Date.parse(String(b.occurred_at))),[events]);
  const [query,setQuery]=useState("");
  const [module,setModule]=useState("all");
  const [playing,setPlaying]=useState(false);
  const [speed,setSpeed]=useState(1);
  const [cursor,setCursor]=useState(Math.max(0,ordered.length-1));
  const modules=useMemo(()=>Array.from(new Set(ordered.map((event)=>String(event.source_module)))).sort(),[ordered]);
  const filtered=useMemo(()=>ordered.filter((event)=>(module==="all"||event.source_module===module)&&`${event.event_type} ${event.entity_type} ${event.entity_id}`.toLowerCase().includes(query.trim().toLowerCase())),[ordered,module,query]);
  const bounded=Math.min(cursor,Math.max(0,filtered.length-1));
  useEffect(()=>{if(!playing||filtered.length<2)return;const timer=window.setInterval(()=>setCursor((value)=>value>=filtered.length-1?0:value+1),Math.max(250,1200/speed));return()=>window.clearInterval(timer);},[filtered.length,playing,speed]);
  const current=filtered[bounded];

  return <section className="yb-panel">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="yb-eyebrow">Timeline et replay déterministe</p><h2 className="text-xl font-black">Chronologie opérationnelle</h2></div><span className="yb-status">{filtered.length} événement(s) réel(s)</span></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
      <label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><span className="sr-only">Rechercher dans la chronologie</span><input className="yb-input min-h-10 w-full pl-9" onChange={(event)=>{setQuery(event.target.value);setCursor(0);}} placeholder="Type, entité, identifiant…" value={query}/></label>
      <select aria-label="Filtrer par source" className="yb-input min-h-10" onChange={(event)=>{setModule(event.target.value);setCursor(0);}} value={module}><option value="all">Toutes les sources</option>{modules.map((value)=><option key={value} value={value}>{value}</option>)}</select>
      <select aria-label="Vitesse du replay" className="yb-input min-h-10" onChange={(event)=>setSpeed(Number(event.target.value))} value={speed}><option value={1}>x1</option><option value={2}>x2</option><option value={4}>x4</option><option value={8}>x8</option></select>
    </div>
    {current?<div className="mt-4 rounded-xl border bg-muted/30 p-4" aria-live="polite"><div className="flex flex-wrap items-center justify-between gap-3"><strong>{String(current.event_type)}</strong><span className="yb-status" data-tone={current.severity==="critical"?"danger":current.severity==="warning"?"warning":"success"}>{String(current.severity)}</span></div><p className="mt-2 text-sm text-muted-foreground">{String(current.source_module)} · {String(current.entity_type)} · {formatDate(String(current.occurred_at))}</p><p className="mt-1 font-mono text-xs">{String(current.entity_id)}</p></div>:<p className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Aucun événement ne correspond aux filtres. Le replay ne fabrique aucun historique.</p>}
    <div className="mt-4 flex flex-wrap items-center gap-2"><button aria-label="Événement précédent" className="yb-button-secondary min-h-10 px-3" disabled={!filtered.length} onClick={()=>setCursor((value)=>Math.max(0,value-1))} type="button"><ChevronLeft className="h-4 w-4"/></button><button className="yb-button-secondary min-h-10 px-4" disabled={filtered.length<2} onClick={()=>setPlaying((value)=>!value)} type="button">{playing?<Pause className="mr-2 inline h-4 w-4"/>:<Play className="mr-2 inline h-4 w-4"/>}{playing?"Pause":"Lecture"}</button><button aria-label="Événement suivant" className="yb-button-secondary min-h-10 px-3" disabled={!filtered.length} onClick={()=>setCursor((value)=>Math.min(filtered.length-1,value+1))} type="button"><ChevronRight className="h-4 w-4"/></button><input aria-label="Position dans le replay" className="min-w-[180px] flex-1 accent-primary" max={Math.max(0,filtered.length-1)} min={0} onChange={(event)=>setCursor(Number(event.target.value))} type="range" value={bounded}/><span className="text-xs font-bold text-muted-foreground">{filtered.length?`${bounded+1}/${filtered.length}`:"0/0"}</span></div>
    <p className="mt-3 text-xs text-muted-foreground">La comparaison état réel / état attendu apparaît uniquement lorsqu’un état attendu versionné est disponible ; aucune valeur de comparaison n’est simulée.</p>
  </section>;
}

function formatDate(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?"Précision temporelle indisponible":new Intl.DateTimeFormat("fr-FR",{dateStyle:"short",timeStyle:"medium"}).format(date);}
