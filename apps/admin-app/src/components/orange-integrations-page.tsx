import { AlertTriangle, CheckCircle2, Clock3, MapPin, RefreshCcw, ShieldCheck } from "lucide-react";
import { Page } from "./command-pages";

type OrangeData = NonNullable<Awaited<ReturnType<typeof import("../lib/orange-integrations").loadOrangeIntegrationData>>>;

export function OrangeIntegrationsPage({ data }: { data: OrangeData }) {
  const active = data.relays.filter((relay) => relay.status === "active").length;
  const lastRun = data.runs[0];
  return <Page eyebrow="Direction Partenaires" title="Intégrations Orange" description="Activation contractuelle, synchronisation des points relais et suivi des échanges avec Orange.">
    <div className={`rounded-xl border p-4 text-sm font-bold ${data.configured ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "border-amber-300 bg-amber-50 text-amber-950"}`}>
      <div className="flex items-start gap-3">{data.configured ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />}<div><p className="font-black">{data.configured ? "Accès technique configuré" : "Accès Orange requis"}</p><p className="mt-1 font-medium">{data.configured ? "Une recette conjointe reste obligatoire avant toute activation en production." : "Aucun endpoint ni identifiant n’est simulé. La synchronisation restera bloquée jusqu’à la remise des accès officiels."}</p></div></div>
    </div>
    {!data.sourceReady ? <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-950"><AlertTriangle className="mr-2 inline h-4 w-4" />Le registre des intégrations n’est pas encore disponible sur cet environnement.</div> : null}
    <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Relais Orange enregistrés" value={data.relays.length} icon={MapPin} /><Kpi label="Relais actifs" value={active} icon={CheckCircle2} /><Kpi label="Synchronisations" value={data.runs.length} icon={RefreshCcw} /><Kpi label="Rejets au dernier échange" value={lastRun?.rejected_count ?? 0} icon={AlertTriangle} /></section>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
      <section className="yb-panel"><p className="yb-eyebrow">Réseau partenaire</p><h2 className="mt-1 text-2xl font-black">Points relais Orange</h2><div className="mt-5 overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead><tr>{["Relais", "Identifiant Orange", "Localité", "Disponibilité", "État", "Dernière mise à jour"].map((label) => <th className="border-b bg-muted px-3 py-3 text-xs font-black uppercase" key={label}>{label}</th>)}</tr></thead><tbody>{data.relays.map((relay) => <tr className="border-b last:border-0" key={relay.id}><td className="px-3 py-4 font-black">{relay.name}</td><td className="px-3 py-4 font-mono text-xs">{relay.external_id}</td><td className="px-3 py-4">{relay.city}, {relay.country}</td><td className="px-3 py-4">{label(relay.availability)}</td><td className="px-3 py-4"><Status value={relay.status} /></td><td className="px-3 py-4">{formatDate(relay.last_synced_at)}</td></tr>)}</tbody></table>{!data.relays.length ? <Empty text="Aucun point relais Orange importé. La liste officielle est attendue." /> : null}</div></section>
      <section className="yb-panel"><p className="yb-eyebrow">Traçabilité</p><h2 className="mt-1 text-2xl font-black">Historique des échanges</h2><div className="mt-5 grid gap-2">{data.runs.map((run) => <article className="rounded-xl border p-3" key={run.id}><div className="flex items-center justify-between gap-3"><p className="font-black">{formatDate(run.started_at)}</p><Status value={run.status} /></div><p className="mt-2 text-xs font-bold text-muted-foreground">{run.imported_count} ajoutés · {run.updated_count} mis à jour · {run.deactivated_count} désactivés · {run.rejected_count} rejetés</p>{run.error_code ? <p className="mt-2 text-xs font-bold text-red-700">Échange interrompu — intervention requise</p> : null}</article>)}{!data.runs.length ? <Empty text="Aucune synchronisation exécutée." /> : null}</div></section>
    </div>
  </Page>;
}

function Kpi({ icon: Icon, label: text, value }: { icon: typeof Clock3; label: string; value: number }) { return <article className="yb-kpi"><Icon className="h-5 w-5 text-primary" /><p className="yb-kpi-value mt-5">{value}</p><p className="mt-2 text-sm font-bold text-muted-foreground">{text}</p></article>; }
function Empty({ text }: { text: string }) { return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</p>; }
function Status({ value }: { value: string }) { const danger = ["failed", "suspended", "inactive"].includes(value); const success = ["completed", "active"].includes(value); return <span className="yb-status" data-tone={danger ? "danger" : success ? "success" : "warning"}>{label(value)}</span>; }
function label(value?: string | null) { return (value || "unknown").replaceAll("_", " "); }
function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }
