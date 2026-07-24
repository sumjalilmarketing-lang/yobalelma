import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

type SponsoredCreative = {
  id: string;
  headline: string;
  body: string;
  cta_label: string;
  destination_url: string;
  image_url: string | null;
  alt_text: string | null;
};

export async function SponsoredPlacement({ code }: { code: "user.home.partner" | "user.discovery.offer" }) {
  const configuredClient = await tryCreateSupabaseServerClient();
  if (!configuredClient) return null;
  const client = configuredClient as unknown as SupabaseClient;
  const placement = await client.from("ad_placements").select("id").eq("code", code).eq("surface", "user_app").eq("enabled", true).maybeSingle();
  if (!placement.data?.id) return null;
  const result = await client.from("ad_creatives").select("id, headline, body, cta_label, destination_url, image_url, alt_text").eq("placement_id", placement.data.id).eq("status", "approved").limit(1).maybeSingle();
  const creative = result.data as SponsoredCreative | null;
  if (!creative || !isSafeHttpsUrl(creative.destination_url) || (creative.image_url && !isSafeHttpsUrl(creative.image_url))) return null;

  return <aside aria-label="Contenu sponsorisé" className="yb-reveal overflow-hidden rounded-xl border border-primary/20 bg-background shadow-line">
    <div className="grid min-h-44 md:grid-cols-[1fr_220px]">
      <div className="p-5 md:p-6"><p className="text-[11px] font-black uppercase tracking-[.16em] text-muted-foreground">Partenaire Yobalelma</p><h2 className="mt-3 text-xl font-black">{creative.headline}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{creative.body}</p><Link className="mt-5 inline-flex h-10 items-center rounded-lg border border-primary px-4 text-sm font-black text-primary hover:bg-primary hover:text-white" href={creative.destination_url} rel="noopener sponsored" target="_blank">{creative.cta_label}</Link></div>
      {creative.image_url ? <div aria-label={creative.alt_text || "Illustration du partenaire"} className="min-h-40 bg-cover bg-center" role="img" style={{ backgroundImage: `url(${JSON.stringify(creative.image_url).slice(1, -1)})` }} /> : <div className="hidden bg-[radial-gradient(circle_at_center,hsl(var(--primary)/.35),transparent_68%)] md:block" />}
    </div>
  </aside>;
}

function isSafeHttpsUrl(value: string) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}
