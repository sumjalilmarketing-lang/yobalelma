import "server-only";

import { selectFromLooseTable } from "@/lib/supabase/loose-query";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export type FinalDeliveryOrder = {
  id: string;
  shipment_id: string;
  batch_id: string | null;
  destination_relay_point_id: string | null;
  delivery_mode: "relay_pickup" | "home_delivery" | null;
  status: string;
  storage_location: string | null;
  recipient_name: string | null;
  recipient_phone_last4: string | null;
  recipient_email: string | null;
  pickup_deadline_at: string | null;
  final_delivery_mission_id: string | null;
  traveler_payout_eligible: boolean;
  final_driver_payout_eligible: boolean;
  payout_blocked_reason: string | null;
  anomaly_count: number;
  delivered_at: string | null;
  updated_at: string;
  shipments?: {
    tracking_code: string;
    origin_city: string;
    origin_country: string;
    destination_city: string;
    destination_country: string;
    status: string;
    estimated_price_cents: number;
    currency: string;
  } | null;
  relay_points?: {
    name: string;
    city: string;
    country: string;
    address_line1: string;
    contact_phone: string;
  } | null;
};

export type DeliveryEventRow = {
  id: string;
  final_delivery_order_id: string | null;
  shipment_id: string;
  actor_id: string | null;
  event_type: string;
  status: string;
  note: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type DeliveryOtpRow = {
  id: string;
  shipment_id: string;
  final_delivery_order_id: string | null;
  delivery_mode: "relay_pickup" | "home_delivery";
  status: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  resend_count: number;
  attempt_count: number;
  blocked_until: string | null;
  created_at: string;
};

export type ProofSummaryRow = {
  id: string;
  proof_of_delivery_id: string;
  shipment_id: string;
  method: string;
  delivered_at: string;
  location_label: string | null;
  recipient_label: string | null;
  summary: Record<string, unknown>;
  created_at: string;
};

export type ManualCorrectionRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  permission_key: string;
  reason: string;
  comment: string;
  status: string;
  requires_second_approval: boolean;
  requested_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function loadFinalDeliveryOrders(limit = 24) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) return { data: [], error: "Supabase n'est pas configure." };

  const { data, error } = await selectFromLooseTable<FinalDeliveryOrder>(
    supabase,
    "final_delivery_orders",
    "id, shipment_id, batch_id, destination_relay_point_id, delivery_mode, status, storage_location, recipient_name, recipient_phone_last4, recipient_email, pickup_deadline_at, final_delivery_mission_id, traveler_payout_eligible, final_driver_payout_eligible, payout_blocked_reason, anomaly_count, delivered_at, updated_at, shipments(tracking_code, origin_city, origin_country, destination_city, destination_country, status, estimated_price_cents, currency), relay_points(name, city, country, address_line1, contact_phone)",
  )
    .order("updated_at", { ascending: false })
    .limit(limit);

  return { data: data ?? [], error: error?.message ?? null };
}

export async function loadFinalDeliveryOrderByShipment(shipmentId: string) {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return {
      events: [],
      order: null,
      otps: [],
      proofs: [],
      error: "Supabase n'est pas configure.",
    };
  }

  const [orderResult, eventsResult, otpsResult, proofsResult] = await Promise.all([
    selectFromLooseTable<FinalDeliveryOrder>(
      supabase,
      "final_delivery_orders",
      "id, shipment_id, batch_id, destination_relay_point_id, delivery_mode, status, storage_location, recipient_name, recipient_phone_last4, recipient_email, pickup_deadline_at, final_delivery_mission_id, traveler_payout_eligible, final_driver_payout_eligible, payout_blocked_reason, anomaly_count, delivered_at, updated_at, shipments(tracking_code, origin_city, origin_country, destination_city, destination_country, status, estimated_price_cents, currency), relay_points(name, city, country, address_line1, contact_phone)",
    )
      .eq("shipment_id", shipmentId)
      .maybeSingle(),
    selectFromLooseTable<DeliveryEventRow>(
      supabase,
      "delivery_events",
      "id, final_delivery_order_id, shipment_id, actor_id, event_type, status, note, metadata, created_at",
    )
      .eq("shipment_id", shipmentId)
      .order("created_at", { ascending: false })
      .limit(30),
    selectFromLooseTable<DeliveryOtpRow>(
      supabase,
      "delivery_otps",
      "id, shipment_id, final_delivery_order_id, delivery_mode, status, expires_at, used_at, revoked_at, resend_count, attempt_count, blocked_until, created_at",
    )
      .eq("shipment_id", shipmentId)
      .order("created_at", { ascending: false })
      .limit(10),
    selectFromLooseTable<ProofSummaryRow>(
      supabase,
      "proof_of_delivery_summaries",
      "id, proof_of_delivery_id, shipment_id, method, delivered_at, location_label, recipient_label, summary, created_at",
    )
      .eq("shipment_id", shipmentId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const error =
    orderResult.error?.message ??
    eventsResult.error?.message ??
    otpsResult.error?.message ??
    proofsResult.error?.message ??
    null;

  return {
    events: eventsResult.data ?? [],
    order: orderResult.data,
    otps: otpsResult.data ?? [],
    proofs: proofsResult.data ?? [],
    error,
  };
}

export async function loadAdminFinalDeliveryAudit() {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return {
      corrections: [],
      events: [],
      otps: [],
      payoutEvents: [],
      proofs: [],
      error: "Supabase n'est pas configure.",
    };
  }

  const [corrections, events, otps, proofs, payoutEvents] = await Promise.all([
    selectFromLooseTable<ManualCorrectionRow>(
      supabase,
      "manual_corrections",
      "id, entity_type, entity_id, action, permission_key, reason, comment, status, requires_second_approval, requested_by, approved_by, created_at, updated_at",
    )
      .order("created_at", { ascending: false })
      .limit(24),
    selectFromLooseTable<DeliveryEventRow>(
      supabase,
      "delivery_events",
      "id, final_delivery_order_id, shipment_id, actor_id, event_type, status, note, metadata, created_at",
    )
      .order("created_at", { ascending: false })
      .limit(24),
    selectFromLooseTable<DeliveryOtpRow>(
      supabase,
      "delivery_otps",
      "id, shipment_id, final_delivery_order_id, delivery_mode, status, expires_at, used_at, revoked_at, resend_count, attempt_count, blocked_until, created_at",
    )
      .order("created_at", { ascending: false })
      .limit(24),
    selectFromLooseTable<ProofSummaryRow>(
      supabase,
      "proof_of_delivery_summaries",
      "id, proof_of_delivery_id, shipment_id, method, delivered_at, location_label, recipient_label, summary, created_at",
    )
      .order("created_at", { ascending: false })
      .limit(24),
    selectFromLooseTable<{
      id: string;
      shipment_id: string;
      beneficiary_id: string | null;
      beneficiary_role: string;
      eligible: boolean;
      blocked_reason: string | null;
      payout_id: string | null;
      created_at: string;
    }>(
      supabase,
      "payout_release_events",
      "id, shipment_id, beneficiary_id, beneficiary_role, eligible, blocked_reason, payout_id, created_at",
    )
      .order("created_at", { ascending: false })
      .limit(24),
  ]);

  const error =
    corrections.error?.message ??
    events.error?.message ??
    otps.error?.message ??
    proofs.error?.message ??
    payoutEvents.error?.message ??
    null;

  return {
    corrections: corrections.data ?? [],
    events: events.data ?? [],
    otps: otps.data ?? [],
    payoutEvents: payoutEvents.data ?? [],
    proofs: proofs.data ?? [],
    error,
  };
}
