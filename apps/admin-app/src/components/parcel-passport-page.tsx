import { AlertTriangle, Fingerprint, MapPin, PackageCheck, Search, ShieldCheck } from "lucide-react";
import { Page } from "./command-pages";
import type { ParcelPassportData } from "../lib/parcel-passport-data";
import { PassportPdfButton } from "./passport-pdf-button";

export function ParcelPassportPage({ data, reference }: { data: ParcelPassportData | null; reference?: string }) {
  return <Page eyebrow="Parcel Investigation" title="Passeport Logistique" description="Dossier opérationnel complet, chaîne de possession et preuves immuables d’un colis.">
    <form action="/command/passports" className="yb-panel grid gap-3 md:grid-cols-[1fr_auto]">
      <label className="grid gap-2"><span className="text-xs font-black uppercase">Numéro de suivi ou identifiant expédition</span><input className="min-h-11 rounded-xl border bg-background px-4" name="query" defaultValue={reference} placeholder="YBL-XXXXXXXX" required /></label>
      <button className="min-h-11 self-end rounded-xl bg-black px-5 font-black text-white" type="submit"><Search className="mr-2 inline h-4 w-4" />Rechercher</button>
    </form>
    {!reference ? <Empty text="Saisissez une référence pour ouvrir le passeport sans exposer les autres colis." /> : !data ? <Empty text="Aucun colis autorisé ne correspond à cette référence." /> : <Passport data={data} />}
  </Page>;
}

function Passport({ data }: { data: ParcelPassportData }) {
  const s=data.shipment; const state=data.state;
  return <div className="grid gap-5">
    <PassportPdfButton reference={text(s.tracking_code)||text(s.id)} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Metric icon={PackageCheck} label="Suivi" value={text(s.tracking_code)} detail={text(s.status)} />
      <Metric icon={Fingerprint} label="Détenteur actuel" value={text(state?.current_custodian_type)||"Indisponible"} detail={short(text(state?.current_custodian_id))} />
      <Metric icon={MapPin} label="Étape" value={human(state?.current_stage)} detail={`Suivante : ${human(state?.next_stage)}`} />
      <Metric icon={ShieldCheck} label="Confiance" value={state ? `${text(state.trust_score)}%` : "Indisponible"} detail={`${data.proofs.filter((proof)=>proof.verification_status==="verified").length} preuve(s) vérifiée(s)`} />
      <Metric icon={AlertTriangle} label="Anomalies" value={data.anomalies.filter((item)=>!["resolved","dismissed"].includes(text(item.status))).length} detail={text(state?.delay_reason)||"Aucun motif de retard"} />
    </section>
    <section className="yb-panel"><p className="yb-eyebrow">Identité et route</p><h2 className="text-xl font-black">{text(data.parcel?.title)||"Colis"}</h2><div className="mt-4 grid gap-3 text-sm md:grid-cols-3"><Field label="Origine" value={`${text(s.origin_city)}, ${text(s.origin_country)}`} /><Field label="Destination" value={`${text(s.destination_city)}, ${text(s.destination_country)}`} /><Field label="ETA" value={date(text(state?.eta)||text(s.latest_delivery_date))} /><Field label="État du colis" value={human(data.events[0]?.parcel_condition)} /><Field label="Dernière position" value={state?.current_latitude ? `${text(state.current_latitude)}, ${text(state.current_longitude)} · ${human(state.location_source)}` : "Position non disponible"} /><Field label="Fraîcheur" value={date(text(state?.updated_at)||text(s.updated_at))} /></div></section>
    <section className="yb-panel"><p className="yb-eyebrow">Chaîne de possession</p><h2 className="text-xl font-black">Timeline append-only</h2>{data.events.length?<ol className="mt-4 grid gap-3">{data.events.map((event)=><li className="rounded-xl border p-4" key={text(event.id)}><div className="flex flex-wrap items-center justify-between gap-2"><strong>#{text(event.sequence_no)} · {human(event.event_type)}</strong><time className="text-xs text-muted-foreground">{date(text(event.occurred_at))}</time></div><p className="mt-2 text-sm">{human(event.stage_before)} → {human(event.stage_after)} · {human(event.previous_custodian_type)} → {human(event.new_custodian_type)}</p><p className="mt-1 text-xs text-muted-foreground">Lieu : {text(event.new_location_id)||"non précisé"} · Source : {human(event.application_source)} / {human(event.event_source)} · Hash {short(text(event.event_hash))}</p>{event.correction_of_event_id?<p className="mt-2 text-xs font-bold text-amber-700">Correction de {short(text(event.correction_of_event_id))} : {text(event.correction_reason)}</p>:null}</li>)}</ol>:<Empty text="Aucun événement de passeport disponible." />}</section>
    <div className="grid gap-5 xl:grid-cols-3"><Table title="Preuves" rows={data.proofs.map((item)=>[human(item.proof_type),human(item.verification_status),date(text(item.captured_at))])}/><Table title="Scellés" rows={data.seals.map((item)=>[short(text(item.id)),human(item.status),date(text(item.applied_at))])}/><Table title="Anomalies" rows={data.anomalies.map((item)=>[human(item.anomaly_type),human(item.severity),human(item.status)])}/></div>
  </div>;
}

function Metric({icon:Icon,label,value,detail}:{icon:typeof PackageCheck;label:string;value:string|number;detail:string}){return <article className="yb-kpi"><Icon className="h-5 w-5 text-primary"/><p className="mt-4 text-xs font-black uppercase text-muted-foreground">{label}</p><p className="mt-1 text-xl font-black">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></article>}
function Field({label,value}:{label:string;value:string}){return <div className="rounded-xl border p-3"><p className="text-xs font-black uppercase text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value||"—"}</p></div>}
function Table({title,rows}:{title:string;rows:string[][]}){return <section className="yb-panel"><h2 className="font-black">{title}</h2>{rows.length?<div className="mt-3 grid gap-2">{rows.map((row,index)=><div className="grid grid-cols-3 gap-2 rounded-lg border p-3 text-xs" key={index}>{row.map((value,i)=><span key={i}>{value||"—"}</span>)}</div>)}</div>:<p className="mt-3 text-sm text-muted-foreground">Aucune donnée.</p>}</section>}
function Empty({text:value}:{text:string}){return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{value}</div>}
function text(value:unknown){return value===null||value===undefined?"":String(value)}
function human(value:unknown){return text(value).replaceAll("_"," ")||"—"}
function short(value:string){return value.length>18?`${value.slice(0,10)}…${value.slice(-6)}`:value||"—"}
function date(value:string){if(!value)return "—";const parsed=new Date(value);return Number.isNaN(parsed.getTime())?"—":new Intl.DateTimeFormat("fr-FR",{dateStyle:"medium",timeStyle:"short"}).format(parsed)}
