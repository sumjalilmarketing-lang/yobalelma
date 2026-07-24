"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, CloudOff, MapPin, PackageCheck, Route, ScanLine, ShieldCheck, Truck } from "lucide-react";
import { useLocalization } from "@/components/i18n/localization-provider";
import { ExperienceSettingsPanel } from "@/components/settings/experience-settings-panel";
import { adaptiveTrackingInterval, type RealtimePosition } from "@/lib/geolocation/realtime";
import { enqueuePosition, pendingPositions, removePositions } from "../lib/offline-location-queue";
import { detectOperationalAnomalies, predictDelay } from "../lib/optimizer";
import type { CollectionMission, CollectionSession, CollectionState, MissionStatus, Tone } from "../lib/types";
import { ActionLink, Badge, inputClass, Metric, PageHeader, Panel } from "./collection-ui";

const statusTone: Record<MissionStatus, Tone> = { assigned: "info", accepted: "info", en_route: "success", at_stop: "warning", loading: "warning", in_transit: "success", unloading: "warning", completed: "success", incident: "danger" };
const moduleTitles: Record<string, [string, string]> = {
  assignment: ["Affectation des missions", "Missions réellement affectées à votre service."],
  "route-optimization": ["Préparation des tournées", "Distances et durées validées par les opérations."],
  quantities: ["Validation des quantités", "Comparaison des manifestes et des colis enregistrés."],
  batches: ["Contrôle des lots", "Lots actuellement rattachés à vos missions."],
  photos: ["Preuves photographiques", "Preuves enregistrées pendant les opérations terrain."],
  signatures: ["Signatures", "Transferts de responsabilité confirmés."],
  history: ["Historique des mouvements", "Événements enregistrés pour vos missions."],
  incidents: ["Incidents", "Incidents réellement déclarés sur vos missions."],
  anomalies: ["Anomalies à traiter", "Écarts calculés à partir des contrôles enregistrés."],
  notifications: ["Notifications", "Alertes destinées à votre compte."],
  messages: ["Messagerie opérationnelle", "Échanges liés à vos missions."],
  planning: ["Planning", "Missions planifiées et en cours."],
  maintenance: ["Maintenance véhicule", "Échéances enregistrées pour le véhicule affecté."],
  mileage: ["Kilométrage", "Relevés enregistrés pour le véhicule affecté."],
  fuel: ["Carburant", "Dernier niveau de carburant enregistré."],
  "driver-documents": ["Documents chauffeur", "Documents et habilitations validés."],
  "vehicle-documents": ["Documents véhicule", "Documents validés pour le véhicule affecté."],
  offline: ["Continuité hors ligne", "Aucune action n’est annoncée comme enregistrée sans confirmation du serveur."],
  sync: ["Synchronisation", "État des actions confirmées par le serveur."],
  support: ["Assistance", "Contactez le centre opérationnel pour une mission bloquée."],
  profile: ["Profil professionnel", "Informations de votre session professionnelle."],
};

export function CollectionRoutePage({ segments, session, state }: { segments?: string[]; session: CollectionSession; state: CollectionState }) {
  const key = segments?.[0] ?? "dashboard";
  if (key === "dashboard") return <Dashboard session={session} state={state} />;
  if (key === "missions") return <Missions state={state} missionId={segments?.[1]} />;
  if (["scanner", "loading", "unloading", "inventory"].includes(key)) return <ScanOperations mode={key} state={state} />;
  if (key === "map" || key === "navigation") return <MapExperience navigationMode={key === "navigation"} state={state} />;
  if (key === "vehicle") return <VehiclePage state={state} />;
  if (key === "settings") return <div className="grid gap-5"><PageHeader eyebrow="Préférences" title="Paramètres" subtitle="Réglez l’affichage et les formats utilisés sur cet appareil." /><ExperienceSettingsPanel /></div>;
  return <OperationalModule moduleKey={key} session={session} state={state} />;
}

function DataUnavailable({ message }: { message?: string }) {
  return <Panel><div className="grid justify-items-center gap-3 py-10 text-center"><CloudOff className="h-9 w-9 text-warning" /><p className="text-lg font-black">Données indisponibles</p><p className="max-w-xl text-sm text-muted-foreground">{message ?? "Aucune donnée opérationnelle n’est disponible pour ce compte."}</p></div></Panel>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <Panel><div className="grid justify-items-center gap-3 py-10 text-center"><CheckCircle2 className="h-9 w-9 text-success" /><p className="text-lg font-black">{title}</p><p className="max-w-xl text-sm text-muted-foreground">{detail}</p></div></Panel>;
}

function Dashboard({ session, state }: { session: CollectionSession; state: CollectionState }) {
  if (state.source === "unavailable") return <div className="grid gap-5"><PageHeader eyebrow="Collection" title={`Bonjour ${session.name}`} subtitle="Vos opérations seront affichées après chargement sécurisé." /><DataUnavailable message={state.loadError} /></div>;
  const active = state.missions.find((mission) => mission.status !== "completed");
  if (!active) return <div className="grid gap-5"><PageHeader eyebrow="Collection" title={`Bonjour ${session.name}`} subtitle="Consultez ici les missions attribuées à votre compte." /><EmptyState title="Aucune mission active" detail="Les nouvelles missions apparaîtront ici dès leur affectation par les opérations." /></div>;
  const anomalies = detectOperationalAnomalies(active); const delay = predictDelay(active);
  return <div className="grid gap-5"><PageHeader eyebrow="Transport interne" title={`Bonjour ${session.name}`} subtitle="Les informations ci-dessous proviennent des opérations enregistrées." actions={<><ActionLink href="/collection/navigation">Voir le parcours</ActionLink><ActionLink href="/collection/scanner" secondary>Enregistrer un colis</ActionLink></>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Mission active" value={active.code} detail={`${active.progress}% terminé`} tone="success" /><Metric label="Colis affectés" value={String(active.packageCount)} detail={`${active.batchCount} lot(s)`} /><Metric label="Risque de retard" value={`${delay.risk}%`} detail="calculé sur les contrôles disponibles" tone={delay.risk >= 65 ? "danger" : delay.risk >= 35 ? "warning" : "success"} /><Metric label="Écarts ouverts" value={String(anomalies.length)} detail="contrôles enregistrés" tone={anomalies.length ? "danger" : "success"} /></div>
    <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><MissionCard mission={active} /><Panel title="Points de contrôle">{anomalies.length ? <div className="grid gap-2">{anomalies.map((item) => <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-sm font-bold" key={item}><AlertTriangle className="h-4 w-4 text-warning" />{item}</div>)}</div> : <p className="text-sm text-muted-foreground">Aucun écart n’est signalé par les contrôles disponibles.</p>}</Panel></div>
    <div className="grid gap-5 lg:grid-cols-2"><Panel title="Prochains arrêts"><Stops mission={active} /></Panel><Panel title="Véhicule"><VehicleSummary state={state} /></Panel></div>
  </div>;
}

function Missions({ state, missionId }: { state: CollectionState; missionId?: string }) {
  if (state.source === "unavailable") return <DataUnavailable message={state.loadError} />;
  const selected = missionId ? state.missions.find((mission) => mission.id === missionId || mission.code === missionId) : undefined;
  if (missionId && !selected) return <EmptyState title="Mission introuvable" detail="Cette mission n’est pas accessible avec votre compte ou n’existe plus." />;
  if (selected) return <div className="grid gap-5"><PageHeader eyebrow={selected.code} title={selected.title} subtitle={`${selected.packageCount} colis · ${selected.batchCount} lot(s)`} actions={<ActionLink href="/collection/navigation">Voir le parcours</ActionLink>} /><MissionCard mission={selected} /><Panel title="Arrêts et chaîne de garde"><Stops mission={selected} /></Panel></div>;
  const active = state.missions.filter((mission) => mission.status !== "completed").length;
  return <div className="grid gap-5"><PageHeader eyebrow="Planning opérationnel" title="Missions" subtitle="Missions accessibles selon votre rôle et vos affectations." /><div className="grid gap-3 sm:grid-cols-3"><Metric label="Total" value={String(state.missions.length)} detail="missions visibles" /><Metric label="En cours" value={String(active)} detail="missions à traiter" tone={active ? "warning" : "success"} /><Metric label="Terminées" value={String(state.missions.length - active)} detail="missions clôturées" /></div>{state.missions.length ? <div className="grid gap-4">{state.missions.map((mission) => <MissionCard key={mission.id} mission={mission} />)}</div> : <EmptyState title="Aucune mission" detail="Aucune mission n’est actuellement affectée à votre compte." />}</div>;
}

function MissionCard({ mission }: { mission: CollectionMission }) {
  return <Panel><div className="flex flex-col gap-4 md:flex-row md:items-center"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-black text-primary"><Route className="h-6 w-6" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-black">{mission.title}</p><Badge tone={statusTone[mission.status]}>{mission.status}</Badge></div><p className="mt-1 text-xs font-bold text-muted-foreground">{mission.code} · {mission.packageCount} colis · {mission.origin} → {mission.destination}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${mission.progress}%` }} /></div></div><Link href={`/collection/missions/${mission.id}`} className="inline-flex items-center gap-1 text-sm font-black text-primary">Détails <ChevronRight className="h-4 w-4" /></Link></div></Panel>;
}

function Stops({ mission }: { mission: CollectionMission }) {
  const { formatDate } = useLocalization();
  if (!mission.stops.length) return <p className="text-sm text-muted-foreground">Aucun arrêt n’est encore enregistré pour cette mission.</p>;
  return <div className="grid gap-2">{mission.stops.map((stop, index) => <div key={stop.id} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-lg border p-3"><span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${stop.status === "completed" ? "bg-success text-white" : stop.status === "arrived" ? "bg-primary text-white" : "bg-muted"}`}>{stop.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><div><p className="font-black">{stop.name}</p><p className="text-xs font-semibold text-muted-foreground">{stop.address}{stop.eta ? ` · ${formatDate(stop.eta)}` : ""}</p></div><span className="text-right text-xs font-black">{stop.expectedPackages > 0 ? `${stop.scannedPackages}/${stop.expectedPackages}` : "—"}<br /><span className="font-semibold text-muted-foreground">colis</span></span></div>)}</div>;
}

function ScanOperations({ mode, state }: { mode: string; state: CollectionState }) {
  const [code, setCode] = useState(""); const [message, setMessage] = useState(""); const [pending, setPending] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); const normalized = code.trim().toUpperCase(); if (!/^YBL-[A-Z]{2}-\d{4}-\d{4}$/u.test(normalized)) { setMessage("Référence non reconnue. Vérifiez le code imprimé sur le colis."); return; } setPending(true); try { const response = await fetch("/api/collection/movements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ trackingCode: normalized, action: mode === "unloading" ? "unloaded" : "loaded", idempotencyKey: `${mode}:${normalized}:${Date.now().toString(36)}` }) }); const result = await response.json() as { error?: string; synchronized?: boolean }; if (!response.ok || !result.synchronized) throw new Error(result.error || "L’opération n’a pas été confirmée."); setMessage(`${normalized} enregistré et confirmé.`); setCode(""); } catch (error) { setMessage(error instanceof Error ? error.message : "L’opération n’a pas été enregistrée."); } finally { setPending(false); } };
  return <div className="grid gap-5"><PageHeader eyebrow="Opération terrain" title={mode === "unloading" ? "Déchargement" : mode === "inventory" ? "Inventaire" : "Enregistrement colis"} subtitle="Une opération n’est validée qu’après confirmation du serveur." /><div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><Panel title="Référence"><form className="grid gap-3" onSubmit={submit}><span className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-black text-primary"><ScanLine className="h-10 w-10" /></span><input aria-label="Code colis" className={inputClass} placeholder="YBL-SN-2607-0101" value={code} onChange={(event) => setCode(event.target.value)} /><button disabled={pending || state.source !== "live"} className="h-11 rounded-lg bg-primary font-black text-white disabled:opacity-60" type="submit">{pending ? "Enregistrement…" : "Valider la référence"}</button></form>{message ? <p role="status" className="mt-3 rounded-lg bg-muted p-3 text-sm font-bold">{message}</p> : null}</Panel><Panel title={`${state.packages.length} colis affecté(s)`}>{state.packages.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr><th className="p-2">Référence</th><th>Lot</th><th>Destination</th><th>État</th></tr></thead><tbody>{state.packages.map((item) => <tr key={item.id} className="border-t"><td className="p-2 font-black">{item.trackingCode}</td><td>{item.batchCode ?? "—"}</td><td>{item.destination}</td><td><Badge tone={item.status === "anomaly" ? "danger" : "neutral"}>{item.status}</Badge></td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">Aucun colis n’est affecté à une mission visible.</p>}</Panel></div></div>;
}

function MapExperience({ navigationMode, state }: { navigationMode: boolean; state: CollectionState }) {
  const mission = state.missions.find((item) => item.status !== "completed");
  if (!mission) return <EmptyState title="Aucun parcours actif" detail="Le parcours sera disponible après l’affectation d’une mission." />;
  return <div className="grid gap-5"><PageHeader eyebrow={navigationMode ? "Parcours" : "Position"} title={mission.title} subtitle="Seules les positions réellement enregistrées sont affichées." actions={<GpsRecorder routeId={mission.id} />} /><div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><Panel><div className="grid min-h-[360px] place-items-center rounded-xl bg-muted/40 p-8 text-center"><MapPin className="h-12 w-12 text-primary" /><div><p className="font-black">{state.gps?.position.label ?? "Position indisponible"}</p><p className="mt-1 text-sm text-muted-foreground">{state.gps ? `${state.gps.position.lat.toFixed(5)}, ${state.gps.position.lng.toFixed(5)}` : "Aucune coordonnée n’a encore été confirmée par le serveur."}</p></div></div></Panel><Panel title="Arrêts"><Stops mission={mission} /></Panel></div></div>;
}

function GpsRecorder({ routeId }: { routeId: string }) {
  const [status,setStatus]=useState<"idle"|"starting"|"tracking"|"delayed"|"denied"|"error">("idle");
  const watchId=useRef<number|null>(null); const lastAcceptedAt=useRef(0); const deviceSessionId=useRef<string>(""); const batteryPercent=useRef<number|null>(null);
  useEffect(()=>()=>{if(watchId.current!==null) navigator.geolocation.clearWatch(watchId.current);},[]);
  const sync=async()=>{if(!navigator.onLine){setStatus("delayed");return;} const positions=await pendingPositions(); if(!positions.length)return; const response=await fetch("/api/collection/gps",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({positions:positions.map((item)=>({...item,networkStatus:item.networkStatus==="offline_replay"?"offline_replay":"online"}))})}); if(response.ok){await removePositions(positions.map((item)=>item.clientEventId));setStatus("tracking");}else setStatus("delayed");};
  const start=async()=>{
    if(!("geolocation" in navigator)){setStatus("error");return;} setStatus("starting"); deviceSessionId.current=crypto.randomUUID();
    try{
      const consent=await fetch("/api/collection/location-consent",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({granted:true,purpose:"active_mission"})}); if(!consent.ok)throw new Error("consent");
      const transition=await fetch("/api/collection/driver-status",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({status:"mission_accepted",routeId,deviceSessionId:deviceSessionId.current,reason:"Suivi démarré par le conducteur"})}); if(!transition.ok)throw new Error("transition");
      const batteryNavigator=navigator as Navigator&{getBattery?:()=>Promise<{level:number}>}; if(batteryNavigator.getBattery) batteryPercent.current=Math.round((await batteryNavigator.getBattery()).level*100);
      watchId.current=navigator.geolocation.watchPosition(async(position)=>{
        const speedKph=position.coords.speed===null?null:Math.max(0,position.coords.speed*3.6); const interval=adaptiveTrackingInterval({speedKph,batteryPercent:batteryPercent.current,background:document.hidden,networkStatus:navigator.onLine?"online":"offline"});
        if(Date.now()-lastAcceptedAt.current<interval)return; lastAcceptedAt.current=Date.now();
        const item:RealtimePosition={clientEventId:crypto.randomUUID(),latitude:position.coords.latitude,longitude:position.coords.longitude,accuracyMeters:position.coords.accuracy,speedKph,headingDegrees:position.coords.heading,batteryPercent:batteryPercent.current,source:"browser",recordedAt:new Date(position.timestamp).toISOString(),networkStatus:navigator.onLine?"online":"offline_replay"};
        await enqueuePosition(item); await sync();
      },async()=>{if(watchId.current!==null){navigator.geolocation.clearWatch(watchId.current);watchId.current=null;}setStatus("denied");await fetch("/api/collection/driver-status",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({status:"gps_unavailable",routeId,deviceSessionId:deviceSessionId.current,reason:"Position indisponible"})});},{enableHighAccuracy:true,maximumAge:15_000,timeout:20_000}); setStatus("tracking");
    }catch{await fetch("/api/collection/location-consent",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({granted:false,purpose:"active_mission"})});setStatus("error");}
  };
  const stop=async()=>{if(watchId.current!==null){navigator.geolocation.clearWatch(watchId.current);watchId.current=null;} await fetch("/api/collection/driver-status",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({status:"paused",routeId,deviceSessionId:deviceSessionId.current||crypto.randomUUID(),reason:"Suivi suspendu par le conducteur"})}); setStatus("idle");};
  const active=status==="tracking"||status==="delayed";
  return <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-muted-foreground" role="status">{status==="tracking"?"GPS actif":status==="delayed"?"Réseau indisponible · synchronisation différée":status==="denied"?"Permission GPS refusée":status==="error"?"Activation impossible":status==="starting"?"Activation…":"GPS arrêté"}</span><button title="Le suivi reste limité à la mission active et s’arrête lors de la suspension." type="button" onClick={active?stop:start} disabled={status==="starting"} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-black text-white disabled:opacity-60"><MapPin className="h-4 w-4" />{active?"Suspendre le suivi":"Démarrer le suivi"}</button></div>;
}

function VehiclePage({ state }: { state: CollectionState }) {
  const vehicle = state.vehicle; if (!vehicle) return <EmptyState title="Aucun véhicule affecté" detail="Les informations du véhicule apparaîtront après son affectation à la mission." />;
  return <div className="grid gap-5"><PageHeader eyebrow={vehicle.plate} title="État du véhicule" subtitle={vehicle.model} /><div className="grid gap-3 sm:grid-cols-3"><Metric label="Capacité" value={`${vehicle.capacityKg} kg`} detail="capacité enregistrée" /><Metric label="Carburant" value={`${vehicle.fuelPercent}%`} detail="dernier relevé" /><Metric label="Kilométrage" value={`${vehicle.mileageKm} km`} detail="dernier relevé" /></div></div>;
}

function VehicleSummary({ state }: { state: CollectionState }) {
  const vehicle = state.vehicle; if (!vehicle) return <p className="text-sm text-muted-foreground">Aucun véhicule n’est affecté à la mission active.</p>;
  return <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-xl bg-black text-primary"><Truck className="h-6 w-6" /></span><div><p className="font-black">{vehicle.model}</p><p className="text-sm text-muted-foreground">{vehicle.plate} · {vehicle.status}</p></div></div>;
}

function OperationalModule({ moduleKey, session, state }: { moduleKey: string; session: CollectionSession; state: CollectionState }) {
  const { formatDate } = useLocalization(); const [title, subtitle] = moduleTitles[moduleKey] ?? ["Module opérationnel", "Données accessibles selon votre rôle."];
  const anomalies = useMemo(() => state.missions.flatMap(detectOperationalAnomalies), [state.missions]);
  const rows = moduleKey === "notifications" ? state.notifications.map((item) => ({ title: item.title, detail: item.message, meta: formatDate(item.at) })) : moduleKey === "messages" ? state.messages.map((item) => ({ title: item.sender, detail: item.message, meta: formatDate(item.at) })) : moduleKey === "incidents" ? state.incidents.map((item) => ({ title: item.title, detail: item.missionCode, meta: formatDate(item.at) })) : moduleKey === "history" ? state.events.map((item) => ({ title: item.action, detail: item.detail, meta: formatDate(item.at) })) : moduleKey === "anomalies" ? anomalies.map((item) => ({ title: item, detail: "Contrôle requis", meta: "Ouvert" })) : state.missions.map((item) => ({ title: item.title, detail: `${item.packageCount} colis · ${item.progress}%`, meta: item.status }));
  return <div className="grid gap-5"><PageHeader eyebrow="Collection" title={title} subtitle={subtitle} actions={<Badge tone="info"><ShieldCheck className="mr-1 h-3.5 w-3.5" />{session.role}</Badge>} /><div className="grid gap-3 sm:grid-cols-3"><Metric label="Missions visibles" value={String(state.missions.length)} detail="selon vos affectations" /><Metric label="Colis affectés" value={String(state.packages.length)} detail="manifestes accessibles" /><Metric label="Éléments affichés" value={String(rows.length)} detail="données enregistrées" /></div>{state.source === "unavailable" ? <DataUnavailable message={state.loadError} /> : rows.length ? <Panel title="Données opérationnelles"><div className="grid gap-3">{rows.map((row, index) => <div key={`${row.title}-${index}`} className="flex items-start gap-3 rounded-lg border p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black text-primary"><PackageCheck className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="font-black">{row.title}</p><p className="mt-1 text-sm text-muted-foreground">{row.detail}</p></div><span className="text-xs font-bold text-muted-foreground">{row.meta}</span></div>)}</div></Panel> : <EmptyState title="Aucune donnée enregistrée" detail="Ce module restera vide jusqu’à ce qu’une opération réelle soit enregistrée." />}</div>;
}
