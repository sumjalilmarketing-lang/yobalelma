import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { getCollectionSession } from "@collection-app/src/lib/auth";
import { assertCollectionAccess } from "@collection-app/src/lib/permissions";
import { assertSameOrigin, rateLimit } from "@collection-app/src/lib/security";
import { correlationId, structuredLog } from "@collection-app/src/lib/observability";

const movementSchema = z.object({
  trackingCode: z.string().trim().regex(/^YBL-[A-Z]{2}-\d{4}-\d{4}$/u),
  action: z.enum(["loaded", "unloaded", "quantity_checked", "photo_added", "signature_added", "anomaly_reported"]),
  idempotencyKey: z.string().min(8).max(160).regex(/^[a-zA-Z0-9:._-]+$/u),
  stopId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  const requestId = correlationId(request);
  try {
    assertSameOrigin(request); const limit = rateLimit(request, 120, 60_000);
    const session = await getCollectionSession(); if (!session) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    assertCollectionAccess(session.role, request.nextUrl.pathname, "POST");
    const payload = movementSchema.parse(await request.json());
    if (session.source === "demo") return response({ accepted: true, id: `demo-${payload.idempotencyKey}`, requestId, synchronized: false }, limit.remaining);
    const supabase = await tryCreateSupabaseServerClient(); if (!supabase) throw new Error("Supabase indisponible.");
    const [{ data: shipment }, { data: route }] = await Promise.all([
      supabase.from("shipments").select("id").eq("tracking_code", payload.trackingCode).maybeSingle(),
      supabase.from("collection_routes").select("id").eq("driver_id", session.userId!).in("status", ["planned", "in_progress"]).order("route_date").limit(1).maybeSingle(),
    ]);
    if (!shipment?.id || !route?.id) throw new Error("Colis ou tournée active introuvable.");
    const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    const { data, error } = await rpc("record_collection_movement", { p_route_id: route.id, p_shipment_id: shipment.id, p_movement_type: payload.action, p_idempotency_key: payload.idempotencyKey, p_stop_id: payload.stopId ?? null, p_metadata: { tracking_code: payload.trackingCode, source: "collection_app" } });
    if (error) throw new Error(error.message);
    structuredLog("info", "collection_movement_recorded", { action: payload.action, requestId, role: session.role });
    return response({ accepted: true, id: data, requestId, synchronized: true }, limit.remaining);
  } catch (error) {
    structuredLog("warn", "collection_movement_rejected", { error: error instanceof Error ? error.name : "UnknownError", requestId });
    return NextResponse.json({ error: error instanceof z.ZodError ? "Mouvement invalide." : error instanceof Error ? error.message : "Mouvement refusé.", requestId }, { status: error instanceof z.ZodError ? 400 : 409 });
  }
}
function response(body: Record<string, unknown>, remaining: number) { const result=NextResponse.json(body); result.headers.set("x-ratelimit-remaining", String(remaining)); return result; }
