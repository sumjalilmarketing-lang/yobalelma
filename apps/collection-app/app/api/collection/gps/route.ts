import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { getCollectionSession } from "@collection-app/src/lib/auth";
import { assertSameOrigin, rateLimit } from "@collection-app/src/lib/security";
import { correlationId, structuredLog } from "@collection-app/src/lib/observability";

const positionSchema = z.object({ clientEventId:z.string().uuid(),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),accuracyMeters:z.number().min(0).max(5000),speedKph:z.number().min(0).max(250).nullable(),headingDegrees:z.number().min(0).max(360).nullable(),batteryPercent:z.number().int().min(0).max(100).nullable(),source:z.enum(["browser","mobile","vehicle_device"]),recordedAt:z.string().datetime(),networkStatus:z.enum(["online","degraded","offline_replay"]) });
const gpsSchema = z.object({ positions:z.array(positionSchema).min(1).max(50) });
export async function POST(request: NextRequest) {
  const requestId = correlationId(request);
  try {
    assertSameOrigin(request); rateLimit(request, 300, 60_000);
    const session = await getCollectionSession();
    if (!session || session.source !== "supabase" || !session.userId) return NextResponse.json({ error: "Authentification professionnelle requise.", requestId }, { status: 401 });
    const input = gpsSchema.parse(await request.json()); const now=Date.now();
    if(input.positions.some((position)=>Date.parse(position.recordedAt)<now-86_400_000||Date.parse(position.recordedAt)>now+300_000)) return NextResponse.json({error:"L’horodatage d’une position n’est pas valide.",requestId},{status:422});
    const client = await tryCreateSupabaseServerClient(); if (!client) return NextResponse.json({ error: "La position ne peut pas être enregistrée pour le moment.", requestId }, { status: 503 });
    const rpc = client.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    const { data, error } = await rpc("record_operational_positions_batch", { p_positions:input.positions.map((position)=>({client_event_id:position.clientEventId,latitude:position.latitude,longitude:position.longitude,accuracy_meters:position.accuracyMeters,speed_kph:position.speedKph,heading_degrees:position.headingDegrees,battery_percent:position.batteryPercent,source:position.source,recorded_at:position.recordedAt,network_status:position.networkStatus})) });
    if (error || data == null) throw new Error(error?.message ?? "Position non enregistrée");
    structuredLog("info", "collection_gps_recorded", { requestId, role: session.role, accepted:Number(data) });
    return NextResponse.json({ accepted: Number(data), requestId, synchronized: true });
  } catch(error) {
    structuredLog("warn", "collection_gps_rejected", { error: error instanceof Error ? error.name : "UnknownError", requestId });
    return NextResponse.json({ error: error instanceof z.ZodError ? "Position GPS invalide." : "La position n’a pas pu être enregistrée.", requestId }, { status: error instanceof z.ZodError ? 400 : 409 });
  }
}
