import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createPaymentProvider, PaymentProviderUnavailableError, paymentStatuses } from "@/lib/payments/providers";
import { assertFreshWebhook, assertPaymentRateLimit, sanitizePaymentPayload } from "@/lib/payments/security";
import { tryCreateSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  try {
    assertPaymentRateLimit(request, 120);
    const body = await request.text();
    if (body.length > 256 * 1024) return NextResponse.json({ accepted: false }, { status: 413 });
    const receivedAt = new Date();
    const provider = createPaymentProvider();
    if (provider.name !== "orange_money" || provider.mode === "test") throw new PaymentProviderUnavailableError();
    const event = await provider.processWebhook({ body, headers: request.headers, receivedAt });
    if (!event.verified || !paymentStatuses.includes(event.status)) return NextResponse.json({ accepted: false }, { status: 401 });
    assertFreshWebhook(event.occurredAt, receivedAt);
    const service = tryCreateSupabaseServiceClient();
    if (!service) throw new PaymentProviderUnavailableError();
    const payload = sanitizePaymentPayload(JSON.parse(body)) as Record<string, unknown>;
    const db = service as SupabaseClient;
    const { data, error } = await db.rpc("apply_verified_payment_event", {
      p_event_type: event.status,
      p_internal_reference: event.internalReference,
      p_provider_event_id: event.eventId,
      p_provider_transaction_id: event.providerTransactionId,
      p_sanitized_payload: payload,
      p_status: event.status,
    });
    if (error) throw error;
    return NextResponse.json({ accepted: true, duplicate: data === false });
  } catch (error) {
    const status = error instanceof PaymentProviderUnavailableError ? 503 : 400;
    return NextResponse.json({ accepted: false }, { status });
  }
}
