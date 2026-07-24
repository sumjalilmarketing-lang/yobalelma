import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { getRelaySession } from "@relay-app/src/lib/auth";
import { assertRelayAccess } from "@relay-app/src/lib/permissions";
import { professionalError } from "@relay-app/src/lib/presentation";
import { assertSameOrigin, rateLimit } from "@relay-app/src/lib/security";

const schema = z.object({ trackingCode: z.string().regex(/^YBL-[A-Z]{2}-\d{4}-\d{4}$/u), relayPointId: z.string().uuid(), locationId: z.string().uuid(), idempotencyKey: z.string().min(8).max(160).optional() });

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); rateLimit(request, 120, 60_000);
    const session = await getRelaySession();
    if (!session) return NextResponse.json({ error: "Connectez-vous pour enregistrer ce rangement." }, { status: 401 });
    assertRelayAccess(session.role, request.nextUrl.pathname, "POST");
    const payload = schema.parse(await request.json());
    if (session.source === "demo") return NextResponse.json({ accepted: true, synchronized: false });
    const configuredClient = await tryCreateSupabaseServerClient();
    if (!configuredClient) throw new Error("service unavailable");
    const supabase = configuredClient as SupabaseClient;
    const { data: eventId, error } = await supabase.rpc("record_relay_storage_traced", {
      p_idempotency_key: payload.idempotencyKey ?? `storage:${payload.trackingCode}:${payload.locationId}`,
      p_location_id: payload.locationId,
      p_relay_point_id: payload.relayPointId,
      p_tracking_code: payload.trackingCode,
    });
    if (error) throw error;
    return NextResponse.json({ accepted: true, synchronized: true, eventId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? "Vérifiez le colis et l’emplacement choisis." : professionalError(error, "Le rangement n’a pas pu être enregistré.") }, { status: error instanceof z.ZodError ? 400 : 409 });
  }
}
