import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { getCollectionSession } from "@collection-app/src/lib/auth";
import { assertSameOrigin, rateLimit } from "@collection-app/src/lib/security";
import { correlationId, structuredLog } from "@collection-app/src/lib/observability";

const gpsSchema = z.object({ routeId: z.string().uuid(), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), accuracyMeters: z.number().min(0).max(5000), speedKph: z.number().min(0).max(220), headingDegrees: z.number().min(0).max(360).nullable().optional(), recordedAt: z.string().datetime() });
export async function POST(request: NextRequest) {
  const requestId = correlationId(request);
  try {
    assertSameOrigin(request); rateLimit(request, 300, 60_000);
    const session = await getCollectionSession();
    if (!session || session.source !== "supabase" || !session.userId) return NextResponse.json({ error: "Authentification professionnelle requise.", requestId }, { status: 401 });
    const position = gpsSchema.parse(await request.json());
    const recordedAt = new Date(position.recordedAt).getTime(); const now = Date.now();
    if (recordedAt < now - 86_400_000 || recordedAt > now + 300_000) return NextResponse.json({ error: "L’horodatage de la position n’est pas valide.", requestId }, { status: 422 });
    const client = await tryCreateSupabaseServerClient(); if (!client) return NextResponse.json({ error: "La position ne peut pas être enregistrée pour le moment.", requestId }, { status: 503 });
    const rpc = client.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    const { data, error } = await rpc("record_collection_gps", { p_route_id: position.routeId, p_latitude: position.latitude, p_longitude: position.longitude, p_accuracy_meters: position.accuracyMeters, p_speed_kph: position.speedKph, p_heading_degrees: position.headingDegrees ?? null });
    if (error || data == null) throw new Error(error?.message ?? "Position non enregistrée");
    structuredLog("info", "collection_gps_recorded", { requestId, role: session.role, routeId: position.routeId });
    return NextResponse.json({ accepted: true, id: data, requestId, synchronized: true });
  } catch(error) {
    structuredLog("warn", "collection_gps_rejected", { error: error instanceof Error ? error.name : "UnknownError", requestId });
    return NextResponse.json({ error: error instanceof z.ZodError ? "Position GPS invalide." : "La position n’a pas pu être enregistrée.", requestId }, { status: error instanceof z.ZodError ? 400 : 409 });
  }
}
