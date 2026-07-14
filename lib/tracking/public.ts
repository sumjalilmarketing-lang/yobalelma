import "server-only";

import { tryCreateSupabaseServiceClient } from "@/lib/supabase/service";
import { selectFromLooseTable } from "@/lib/supabase/loose-query";
import {
  isValidTrackingCode,
  normalizeTrackingCode,
  toPublicTrackingShipment,
  type PublicTrackingShipment,
} from "@/lib/tracking/public-view";

export {
  isValidTrackingCode,
  normalizeTrackingCode,
  toPublicTrackingShipment,
  type PublicTrackingShipment,
} from "@/lib/tracking/public-view";

export type PublicTrackingState =
  | { status: "idle" }
  | { status: "invalid"; trackingCode: string }
  | { status: "needs-env"; trackingCode: string }
  | { status: "not-found"; trackingCode: string }
  | { status: "ready"; shipment: PublicTrackingShipment };

export async function getPublicTrackingState(
  rawTrackingCode?: string,
): Promise<PublicTrackingState> {
  if (!rawTrackingCode) {
    return { status: "idle" };
  }

  const trackingCode = normalizeTrackingCode(rawTrackingCode);

  if (!isValidTrackingCode(trackingCode)) {
    return { status: "invalid", trackingCode };
  }

  const supabase = tryCreateSupabaseServiceClient();

  if (!supabase) {
    return { status: "needs-env", trackingCode };
  }

  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .select(
      "id, tracking_code, scope, status, origin_city, origin_country, destination_city, destination_country, eta_min_days, eta_max_days, created_at, updated_at",
    )
    .eq("tracking_code", trackingCode)
    .maybeSingle();

  if (shipmentError || !shipment) {
    return { status: "not-found", trackingCode };
  }

  const { data: events } = await supabase
    .from("shipment_status_events")
    .select("id, status, created_at")
    .eq("shipment_id", shipment.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: finalDeliveryEvents } = await selectFromLooseTable<{
    created_at: string;
    event_type: string;
    id: string;
    status: string;
  }>(
    supabase,
    "delivery_events",
    "id, status, event_type, created_at",
  )
    .eq("shipment_id", shipment.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    shipment: toPublicTrackingShipment(shipment, events ?? [], finalDeliveryEvents ?? []),
    status: "ready",
  };
}
