import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { fromSupabaseTable } from "./supabase-loose";
import type {
  AnomalyType,
  HubSession,
  InboundItemStatus,
  Inspection,
  InspectionDecision,
  InventoryStatus,
  Priority,
  PickupQrToken,
} from "./types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof tryCreateSupabaseServerClient>>>;

type HubInventoryWeightRow = {
  measured_weight_kg: number | null;
};

type HubBatchIdRow = {
  id: string;
};

type PickupQrRow = {
  expires_at: string;
  token: string;
  token_id: string;
};

export function canUseHubFixture(session: HubSession) {
  return process.env.NODE_ENV !== "production" && session.source === "demo";
}

export function requireLiveHubMutation(result: boolean | string | null, session: HubSession) {
  if (result) return result;
  if (canUseHubFixture(session)) return null;
  throw new Error("L’opération n’a pas été confirmée par le service Hub.");
}

function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && uuidPattern.test(value));
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

async function liveClient(session: HubSession) {
  if (session.source !== "supabase" || !session.userId || !isUuid(session.hubId)) {
    return null;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id === session.userId ? supabase : null;
}

function inboundStatus(status: InboundItemStatus) {
  return status === "quarantined_at_hub" ? "quarantined" : status;
}

function inspectionDecision(decision: InspectionDecision) {
  if (decision === "repackaging_required") {
    return "needs_repackaging";
  }

  if (decision === "customer_confirmation_required") {
    return "needs_customer_confirmation";
  }

  return decision;
}

async function reservedWeightKg(supabase: SupabaseClient, shipmentId: string) {
  const { data: inventory } = await fromSupabaseTable(supabase, "hub_inventory")
    .select<HubInventoryWeightRow>("measured_weight_kg")
    .eq("shipment_id", shipmentId)
    .eq("active", true)
    .maybeSingle();

  if (typeof inventory?.measured_weight_kg === "number" && inventory.measured_weight_kg > 0) {
    return inventory.measured_weight_kg;
  }

  return 1;
}

export async function tryScanInboundPackageLive(input: {
  manifestId: string;
  note?: string;
  photoCount?: number;
  session: HubSession;
  status: InboundItemStatus;
  trackingCode: string;
}) {
  const supabase = await liveClient(input.session);

  if (!supabase) {
    return false;
  }

  if (!isUuid(input.manifestId)) {
    return false;
  }

  const { error } = await callSupabaseRpc<string>(supabase, "scan_hub_inbound_item", {
    p_note: nullableText(input.note),
    p_photo_paths: [],
    p_receipt_id: input.manifestId,
    p_status: inboundStatus(input.status),
    p_tracking_code: input.trackingCode,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function tryConfirmInboundManifestLive(manifestId: string, session: HubSession) {
  const supabase = await liveClient(session);

  if (!supabase || !isUuid(manifestId)) {
    return false;
  }

  const { error } = await callSupabaseRpc<string>(supabase, "confirm_hub_inbound_receipt", {
    p_receipt_id: manifestId,
  });

  if (error) throw new Error(error.message);

  return true;
}

export async function tryRecordInspectionLive(input: {
  decision?: InspectionDecision;
  measuredWeightKg: number;
  note?: string;
  packagingQuality: Inspection["packagingQuality"];
  session: HubSession;
  shipmentId: string;
}) {
  const supabase = await liveClient(input.session);

  if (!supabase || !isUuid(input.shipmentId)) {
    return false;
  }

  const { error } = await callSupabaseRpc<string>(supabase, "record_hub_inspection", {
    p_decision: inspectionDecision(input.decision ?? "approved"),
    p_hub_id: input.session.hubId,
    p_measured_dimensions: {},
    p_measured_weight_kg: input.measuredWeightKg,
    p_note: nullableText(input.note),
    p_package_condition: input.packagingQuality === "non_compliant" ? "non conforme" : "conforme",
    p_packaging_compliant: input.packagingQuality !== "non_compliant",
    p_photo_paths: [],
    p_shipment_id: input.shipmentId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function tryMoveInventoryLive(input: {
  measuredWeightKg?: number;
  note?: string;
  session: HubSession;
  shipmentId: string;
  status?: InventoryStatus;
  toLocationId: string;
}) {
  const supabase = await liveClient(input.session);

  if (!supabase || !isUuid(input.shipmentId)) {
    return false;
  }

  const { error } = await callSupabaseRpc<string>(supabase, "move_hub_inventory", {
    p_hub_id: input.session.hubId,
    p_measured_weight_kg: input.measuredWeightKg ?? null,
    p_note: nullableText(input.note),
    p_shipment_id: input.shipmentId,
    p_status: input.status ?? "in_storage",
    p_to_location_id: isUuid(input.toLocationId) ? input.toLocationId : null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function tryCreateBatchLive(input: {
  session: HubSession;
  shipmentIds: string[];
  tripId: string;
}) {
  const supabase = await liveClient(input.session);

  if (!supabase || !isUuid(input.tripId)) {
    return null;
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("available_weight_kg, departure_date, destination_city, destination_country, origin_city, origin_country, traveler_id")
    .eq("id", input.tripId)
    .maybeSingle();

  if (tripError) {
    throw new Error(tripError.message);
  }

  if (!trip) {
    throw new Error("Trip not found.");
  }

  const code = `HUB-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const { data: batch, error } = await fromSupabaseTable(supabase, "hub_batches")
    .insert<HubBatchIdRow>({
      capacity_kg: trip.available_weight_kg,
      code,
      created_by: input.session.userId,
      departure_date: trip.departure_date,
      destination_city: trip.destination_city,
      destination_country: trip.destination_country,
      destination_hub: `${trip.destination_city}, ${trip.destination_country}`,
      hub_id: input.session.hubId,
      origin_hub: `${trip.origin_city}, ${trip.origin_country}`,
      status: "open",
      traveler_id: trip.traveler_id,
      trip_id: input.tripId,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!batch) {
    throw new Error("Batch creation did not return an id.");
  }

  for (const shipmentId of input.shipmentIds.filter(isUuid)) {
    const reservedWeight = await reservedWeightKg(supabase, shipmentId);
    const { error: reservationError } = await callSupabaseRpc<string>(
      supabase,
      "reserve_hub_batch_capacity_v2",
      {
        p_batch_id: batch.id,
        p_reserved_weight_kg: reservedWeight,
        p_shipment_id: shipmentId,
      },
    );

    if (reservationError) {
      throw new Error(reservationError.message);
    }
  }

  return batch.id;
}

export async function tryReserveShipmentForBatchLive(input: {
  batchId: string;
  session: HubSession;
  shipmentId: string;
}) {
  const supabase = await liveClient(input.session);

  if (!supabase || !isUuid(input.batchId) || !isUuid(input.shipmentId)) {
    return false;
  }

  const reservedWeight = await reservedWeightKg(supabase, input.shipmentId);
  const { error } = await callSupabaseRpc<string>(supabase, "reserve_hub_batch_capacity_v2", {
    p_batch_id: input.batchId,
    p_reserved_weight_kg: reservedWeight,
    p_shipment_id: input.shipmentId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function tryGeneratePickupQrLive(batchId: string, session: HubSession) {
  const supabase = await liveClient(session);

  if (!supabase || !isUuid(batchId)) {
    return null;
  }

  const { error: statusError } = await fromSupabaseTable(supabase, "hub_batches")
    .update({
      ready_at: new Date().toISOString(),
      status: "ready",
      validated_by: session.userId,
      validated_at: new Date().toISOString(),
    })
    .eq("id", batchId);

  if (statusError) {
    throw new Error(statusError.message);
  }

  const { data, error } = await callSupabaseRpc<PickupQrRow[]>(supabase, "create_handover_qr_token", {
    p_batch_id: batchId,
    p_expires_in_minutes: 240,
    p_token_type: "origin_pickup",
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = data?.[0];

  if (!row?.token || !row.token_id || !row.expires_at) {
    throw new Error("Pickup QR generation did not return a token.");
  }

  const { error: pickupStatusError } = await fromSupabaseTable(supabase, "hub_batches")
    .update({ status: "pickup_qr_generated" })
    .eq("id", batchId);

  if (pickupStatusError) throw new Error(pickupStatusError.message);

  return {
    batchId,
    expiresAt: row.expires_at,
    hubId: session.hubId,
    id: row.token_id,
    revoked: false,
    token: row.token,
    tripId: "",
    travelerId: "",
  } satisfies PickupQrToken;
}

export async function tryHandoverBatchLive(input: {
  batchId: string;
  measuredWeightKg?: number;
  note?: string;
  session: HubSession;
  token: string;
  verifiedDocument: boolean;
  verifiedIdentity: boolean;
  verifiedTicket: boolean;
}) {
  const supabase = await liveClient(input.session);

  if (!supabase || !isUuid(input.batchId)) {
    return false;
  }

  const { error: tokenError } = await callSupabaseRpc(supabase, "scan_handover_qr_token", {
    p_expected_token_type: "origin_pickup",
    p_note: nullableText(input.note),
    p_token: input.token,
  });

  if (tokenError) {
    throw new Error(tokenError.message);
  }

  const { error } = await callSupabaseRpc<string>(supabase, "record_hub_handover_event", {
    p_batch_id: input.batchId,
    p_measured_weight_kg: input.measuredWeightKg ?? null,
    p_note: nullableText(input.note),
    p_photo_paths: [],
    p_signature_path: null,
    p_token_id: null,
    p_verified_document: input.verifiedDocument,
    p_verified_identity: input.verifiedIdentity,
    p_verified_ticket: input.verifiedTicket,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function tryCreateAnomalyLive(input: {
  batchId?: string;
  blocksPayout?: boolean;
  description: string;
  hubId: string;
  priority: Priority;
  session: HubSession;
  shipmentId?: string;
  title: string;
  type: AnomalyType;
}) {
  const supabase = await liveClient(input.session);

  if (!supabase) {
    return false;
  }

  const { error } = await callSupabaseRpc<string>(supabase, "create_hub_incident", {
    p_batch_id: isUuid(input.batchId) ? input.batchId : null,
    p_blocks_payout: Boolean(input.blocksPayout),
    p_description: nullableText(input.description),
    p_hub_id: input.session.hubId,
    p_incident_type: input.type,
    p_priority: input.priority,
    p_shipment_id: isUuid(input.shipmentId) ? input.shipmentId : null,
    p_title: input.title,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function tryResolveAnomalyLive(id: string, session: HubSession) {
  const supabase = await liveClient(session);
  if (!supabase || !isUuid(id)) return false;
  const { data, error } = await fromSupabaseTable(supabase, "operational_incidents")
    .update({ resolved_at: new Date().toISOString(), resolved_by: session.userId, status: "resolved" })
    .eq("id", id)
    .eq("hub_id", session.hubId)
    .select<{ id: string }>("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Incident introuvable dans votre périmètre.");
  return true;
}
