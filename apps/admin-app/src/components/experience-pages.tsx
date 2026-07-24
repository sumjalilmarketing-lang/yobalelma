import { BarChart3, CheckCircle2, CircleDollarSign, Globe2, Megaphone, ShieldCheck } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { Page } from "./command-pages";
import { AdvertiserForm, CountryExperienceForm } from "./experience-forms";

const countrySections = ["Langues et formats", "Devise et unités", "Thème et illustrations", "Services et partenaires", "Paiements disponibles", "Textes et mentions", "Support et fuseau horaire", "Jours fériés et règles locales"];
const monetizationSections = ["Annonceurs", "Campagnes", "Créations", "Emplacements", "Ciblage", "Budgets", "Validation", "Modération", "Facturation", "Statistiques", "Incidents", "Paramètres"];

export async function CountryExperiencePage() {
  const stats = await countryStats();
  return <Page eyebrow="Configuration internationale" title="Expérience par pays" description="Préparez, faites valider et publiez chaque déclinaison locale sans modifier le socle Yobalelma.">
    <div className="grid gap-4 md:grid-cols-3"><Metric icon={Globe2} value={String(stats.countries)} label="pays configurés" /><Metric icon={CheckCircle2} value={String(stats.published)} label="versions publiées" /><Metric icon={ShieldCheck} value={String(stats.review)} label="versions à valider" /></div>
    <section className="rounded-xl border bg-background p-5 shadow-line"><div><p className="text-xs font-black uppercase tracking-[.15em] text-primary">Édition contrôlée</p><h2 className="mt-1 text-2xl font-black">Paramètres locaux</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{countrySections.map((label) => <article key={label} className="rounded-lg border p-4"><Globe2 className="h-5 w-5 text-primary" /><p className="mt-3 font-black">{label}</p><p className="mt-1 text-xs text-muted-foreground">Prévisualisation et historique disponibles</p></article>)}</div><div className="mt-5"><CountryExperienceForm /></div></section>
    <Workflow />
  </Page>;
}

export async function MonetizationPage() {
  const stats = await monetizationStats();
  return <Page eyebrow="Partenariats" title="Publicité et monétisation" description="Pilotez des campagnes clairement identifiées, non intrusives et réservées aux surfaces autorisées.">
    <div className="grid gap-4 md:grid-cols-3"><Metric icon={Megaphone} value={String(stats.campaigns)} label="campagnes actives" /><Metric icon={CircleDollarSign} value={String(stats.advertisers)} label="annonceurs" /><Metric icon={BarChart3} value={String(stats.creatives)} label="créations approuvées" /></div>
    <section className="rounded-xl border bg-background p-5 shadow-line"><div><p className="text-xs font-black uppercase tracking-[.15em] text-primary">Catalogue</p><h2 className="mt-1 text-2xl font-black">Pilotage des campagnes</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{monetizationSections.map((label) => <article key={label} className="rounded-lg border p-4"><Megaphone className="h-5 w-5 text-primary" /><p className="mt-3 font-black">{label}</p><p className="mt-1 text-xs text-muted-foreground">Accès selon votre responsabilité</p></article>)}</div><div className="mt-5"><AdvertiserForm /></div></section>
    <section className="rounded-xl border border-primary/30 bg-primary/5 p-5"><div className="flex gap-3"><ShieldCheck className="h-6 w-6 shrink-0 text-primary" /><div><h2 className="font-black">Diffusion maîtrisée</h2><p className="mt-1 text-sm text-muted-foreground">Les nouveaux emplacements restent désactivés jusqu’à leur validation. Les campagnes sont limitées à User App, au site et à l’application mobile.</p></div></div></section>
  </Page>;
}

function Workflow() { return <section className="rounded-xl border bg-background p-5 shadow-line"><h2 className="text-xl font-black">Cycle de publication</h2><ol className="mt-4 grid gap-3 md:grid-cols-5">{["Brouillon", "Prévisualisation", "Validation", "Publication", "Retour arrière"].map((label, index) => <li key={label} className="rounded-lg bg-muted p-3"><span className="text-xs font-black text-primary">0{index + 1}</span><p className="mt-1 font-black">{label}</p></li>)}</ol></section>; }
function Metric({ icon: Icon, label, value }: { icon: typeof Globe2; label: string; value: string }) { return <article className="rounded-xl border bg-background p-5 shadow-line"><Icon className="h-6 w-6 text-primary" /><p className="mt-4 text-3xl font-black">{value}</p><p className="text-sm font-bold text-muted-foreground">{label}</p></article>; }

async function countryStats() {
  const configured = await tryCreateSupabaseServerClient();
  if (!configured) return { countries: 0, published: 0, review: 0 };
  const client = configured as unknown as SupabaseClient;
  const [all, published, review] = await Promise.all([client.from("country_experience_configs").select("country_code"), client.from("country_experience_configs").select("id", { count: "exact", head: true }).eq("status", "published"), client.from("country_experience_configs").select("id", { count: "exact", head: true }).eq("status", "in_review")]);
  return { countries: new Set((all.data ?? []).map((item) => item.country_code)).size, published: published.count ?? 0, review: review.count ?? 0 };
}

async function monetizationStats() {
  const configured = await tryCreateSupabaseServerClient();
  if (!configured) return { campaigns: 0, advertisers: 0, creatives: 0 };
  const client = configured as unknown as SupabaseClient;
  const [campaigns, advertisers, creatives] = await Promise.all([client.from("ad_campaigns").select("id", { count: "exact", head: true }).eq("status", "active"), client.from("advertisers").select("id", { count: "exact", head: true }).not("status", "eq", "archived"), client.from("ad_creatives").select("id", { count: "exact", head: true }).eq("status", "approved")]);
  return { campaigns: campaigns.count ?? 0, advertisers: advertisers.count ?? 0, creatives: creatives.count ?? 0 };
}
