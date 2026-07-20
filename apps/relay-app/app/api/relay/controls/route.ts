import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { getRelaySession } from "@relay-app/src/lib/auth";
import { assertRelayAccess } from "@relay-app/src/lib/permissions";
import { professionalError } from "@relay-app/src/lib/presentation";
import { assertSameOrigin, rateLimit } from "@relay-app/src/lib/security";

const schema = z.object({
  trackingCode: z.string().regex(/^YBL-[A-Z]{2}-\d{4}-\d{4}$/u),
  relayPointId: z.string().min(1),
  idempotencyKey: z.string().min(8).max(160).regex(/^[a-zA-Z0-9:._-]+$/u),
  weightKg: z.number().positive().max(300),
  dimensions: z.object({ lengthCm: z.number().positive().max(300), widthCm: z.number().positive().max(300), heightCm: z.number().positive().max(300) }),
  qualityScore: z.number().int().min(0).max(100),
  photoCount: z.number().int().min(0).max(20),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    rateLimit(request, 120, 60_000);
    const session = await getRelaySession();
    if (!session) return NextResponse.json({ error: "Connectez-vous pour enregistrer ce contrôle." }, { status: 401 });
    assertRelayAccess(session.role, request.nextUrl.pathname, "POST");
    const control = schema.parse(await request.json());
    if (session.source === "demo") return NextResponse.json({ accepted: true, synchronized: false });
    if (!z.string().uuid().safeParse(control.relayPointId).success) throw new Error("Invalid relay point");
    if (!session.userId) throw new Error("Authentication required");
    const configuredClient = await tryCreateSupabaseServerClient();
    if (!configuredClient) throw new Error("service unavailable");
    const supabase = configuredClient as SupabaseClient;
    const { data: shipment, error: shipmentError } = await supabase.from("shipments").select("id").eq("tracking_code", control.trackingCode).maybeSingle();
    if (shipmentError) throw shipmentError;
    if (!shipment?.id) throw new Error("Shipment not found");
    const decision = control.qualityScore < 50 ? "refused" : control.qualityScore < 75 ? "anomaly" : "accepted";
    const { error } = await supabase.from("relay_package_controls").upsert({
      shipment_id: shipment.id,
      relay_point_id: control.relayPointId,
      actor_id: session.userId,
      weight_kg: control.weightKg,
      dimensions: control.dimensions,
      quality_score: control.qualityScore,
      photo_count: control.photoCount,
      decision,
      idempotency_key: control.idempotencyKey,
    }, { onConflict: "actor_id,idempotency_key" });
    if (error) throw error;
    await supabase.from("relay_inventory").update({ quality_score: control.qualityScore, status: decision === "accepted" ? "stored" : "exception", updated_by: session.userId }).eq("shipment_id", shipment.id).eq("current_relay_point_id", control.relayPointId);
    return NextResponse.json({ accepted: true, decision, synchronized: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? "Vérifiez les mesures et la référence du colis." : professionalError(error, "Le contrôle n’a pas pu être enregistré.") }, { status: error instanceof z.ZodError ? 400 : 409 });
  }
}
