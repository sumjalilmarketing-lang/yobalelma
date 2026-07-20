import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { getRelaySession } from "@relay-app/src/lib/auth";
import { assertRelayAccess } from "@relay-app/src/lib/permissions";
import { professionalError } from "@relay-app/src/lib/presentation";
import { assertSameOrigin, rateLimit } from "@relay-app/src/lib/security";

const schema = z.object({ trackingCode: z.string().regex(/^YBL-[A-Z]{2}-\d{4}-\d{4}$/u), relayPointId: z.string().min(1), locationId: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); rateLimit(request, 120, 60_000);
    const session = await getRelaySession();
    if (!session) return NextResponse.json({ error: "Connectez-vous pour enregistrer ce rangement." }, { status: 401 });
    assertRelayAccess(session.role, request.nextUrl.pathname, "POST");
    const payload = schema.parse(await request.json());
    if (session.source === "demo") return NextResponse.json({ accepted: true, synchronized: false });
    if (!z.string().uuid().safeParse(payload.relayPointId).success || !z.string().uuid().safeParse(payload.locationId).success) throw new Error("Invalid location");
    const configuredClient = await tryCreateSupabaseServerClient();
    if (!configuredClient) throw new Error("service unavailable");
    const supabase = configuredClient as SupabaseClient;
    const [{ data: shipment }, { data: location }] = await Promise.all([
      supabase.from("shipments").select("id").eq("tracking_code", payload.trackingCode).maybeSingle(),
      supabase.from("relay_storage_locations").select("id").eq("id", payload.locationId).eq("relay_point_id", payload.relayPointId).maybeSingle(),
    ]);
    if (!shipment?.id) throw new Error("Shipment not found");
    if (!location?.id) throw new Error("Invalid location");
    const { error } = await supabase.from("relay_inventory").update({ storage_location_id: payload.locationId, status: "stored", updated_by: session.userId, updated_at: new Date().toISOString() }).eq("shipment_id", shipment.id).eq("current_relay_point_id", payload.relayPointId);
    if (error) throw error;
    return NextResponse.json({ accepted: true, synchronized: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? "Vérifiez le colis et l’emplacement choisis." : professionalError(error, "Le rangement n’a pas pu être enregistré.") }, { status: error instanceof z.ZodError ? 400 : 409 });
  }
}
