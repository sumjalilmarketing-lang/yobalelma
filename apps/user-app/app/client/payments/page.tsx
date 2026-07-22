import { PaymentFlow } from "@/apps/user-app/src/components/payment-flow";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paiements | Yobalelma" };

export default async function Page({ searchParams }: { searchParams: Promise<{ shipmentId?: string }> }) {
  const { shipmentId } = await searchParams;
  const supabase = await tryCreateSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const { data: shipment } = supabase && user && shipmentId ? await supabase.from("shipments").select("id, estimated_price_cents, currency").eq("id", shipmentId).eq("sender_id", user.id).maybeSingle() : { data: null };
  return <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-6 md:py-12"><header className="yb-page-hero"><p className="yb-eyebrow text-orange-300">Paiement sécurisé</p><h1 className="mt-3 text-3xl font-black md:text-5xl">Régler une expédition</h1><p className="yb-page-hero-description mt-3">Un parcours clair, avec confirmation côté fournisseur avant émission du reçu.</p></header><PaymentFlow amount={shipment?.estimated_price_cents} currency={shipment?.currency} shipmentId={shipment?.id} /></main>;
}
