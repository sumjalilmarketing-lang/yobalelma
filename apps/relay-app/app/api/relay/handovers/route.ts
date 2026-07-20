import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { getRelaySession } from "@relay-app/src/lib/auth";
import { correlationId, structuredLog } from "@relay-app/src/lib/observability";
import { assertRelayAccess } from "@relay-app/src/lib/permissions";
import { professionalError } from "@relay-app/src/lib/presentation";
import { assertSameOrigin, rateLimit } from "@relay-app/src/lib/security";

const schema = z.object({
  trackingCode: z.string().trim().regex(/^YBL-[A-Z]{2}-\d{4}-\d{4}$/u),
  shipmentId: z.string().min(1),
  relayPointId: z.string().min(1),
  recipientType: z.enum(["internal_carrier", "recipient"]),
  otpCode: z.string().regex(/^\d{6}$/u).optional(),
  signerName: z.string().trim().min(2).max(120),
  idempotencyKey: z.string().min(8).max(160).regex(/^[a-zA-Z0-9:._-]+$/u),
});

export async function POST(request: NextRequest) {
  const requestId = correlationId(request);
  try {
    assertSameOrigin(request);
    rateLimit(request, 60, 60_000);
    const session = await getRelaySession();
    if (!session) return NextResponse.json({ error: "Connectez-vous pour enregistrer cette remise." }, { status: 401 });
    assertRelayAccess(session.role, request.nextUrl.pathname, "POST");
    const payload = schema.parse(await request.json());
    if (session.source === "demo") return NextResponse.json({ accepted: true, synchronized: false, requestId });
    if (!z.string().uuid().safeParse(payload.shipmentId).success || !z.string().uuid().safeParse(payload.relayPointId).success) throw new Error("Shipment not found");
    const configuredClient = await tryCreateSupabaseServerClient();
    if (!configuredClient) throw new Error("service unavailable");
    const supabase = configuredClient as SupabaseClient;

    if (payload.recipientType === "recipient") {
      if (!payload.otpCode) throw new Error("OTP required");
      const { data: verification, error: verifyError } = await supabase.rpc("verify_delivery_otp", {
        p_shipment_id: payload.shipmentId,
        p_delivery_mode: "relay_pickup",
        p_otp_code: payload.otpCode,
        p_recipient_name: payload.signerName,
        p_note: "Remise confirmée au point relais.",
      });
      if (verifyError) throw verifyError;
      const result = Array.isArray(verification) ? verification[0] : verification;
      if (!result || result.verified !== true) throw new Error("OTP invalid");
    }

    const signatureHash = await sha256(`${session.userId}:${payload.signerName}:${payload.trackingCode}:${payload.idempotencyKey}`);
    const { data, error } = await supabase.rpc("record_relay_handover", {
      p_tracking_code: payload.trackingCode,
      p_relay_point_id: payload.relayPointId,
      p_recipient_type: payload.recipientType,
      p_otp_verified: payload.recipientType === "recipient",
      p_signature_hash: signatureHash,
      p_idempotency_key: payload.idempotencyKey,
      p_metadata: { signer_name: payload.signerName },
    });
    if (error) throw error;
    structuredLog("info", "relay_handover_recorded", { requestId, role: session.role });
    return NextResponse.json({ accepted: true, id: data, synchronized: true, requestId });
  } catch (error) {
    structuredLog("warn", "relay_handover_rejected", { requestId, error: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: error instanceof z.ZodError ? "Vérifiez les informations de remise." : professionalError(error, "La remise n’a pas pu être enregistrée."), requestId }, { status: error instanceof z.ZodError ? 400 : 409 });
  }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
