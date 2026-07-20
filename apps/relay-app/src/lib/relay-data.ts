import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { getRelayState } from "./relay-store";
import type { RelayPackage, RelayPackageStatus, RelaySession, RelayState, StorageLocation } from "./types";

type PointRow = { id: string; name: string; address_line1: string; city: string; country: string; capacity_slots: number };
type InventoryRow = { id: string; shipment_id: string; status: "stored" | "released" | "exception"; checked_in_at: string; checked_out_at: string | null; quality_score: number | null; due_at: string | null; storage_location_id: string | null };
type ShipmentRow = { id: string; tracking_code: string; destination_city: string; destination_country: string; latest_delivery_date: string; status: string };
type PackageRow = { shipment_id: string; weight_kg: number; length_cm: number; width_cm: number; height_cm: number };
type AddressRow = { shipment_id: string; contact_name: string; type: string };
type LocationRow = { id: string; code: string; kind: StorageLocation["kind"]; zone: string; capacity: number; max_weight_kg: number; status: StorageLocation["status"] };
type ScanRow = { id: string; shipment_id: string; actor_id: string; scan_type: string; note: string | null; created_at: string };
type ProfileRow = { id: string; full_name: string };

export async function loadRelayState(session: RelaySession): Promise<RelayState> {
  if (session.source === "demo") return getRelayState();
  const client = await tryCreateSupabaseServerClient();
  if (!client || !session.userId) return emptyRelayState();
  const supabase = client as SupabaseClient;
  const relayPointId = session.relayPointId ?? await findAccessiblePoint(supabase, session);
  if (!relayPointId) return emptyRelayState();

  const [{ data: pointData }, { data: inventoryData }, { data: locationData }, { data: scanData }] = await Promise.all([
    supabase.from("relay_points").select("id,name,address_line1,city,country,capacity_slots").eq("id", relayPointId).maybeSingle(),
    supabase.from("relay_inventory").select("id,shipment_id,status,checked_in_at,checked_out_at,quality_score,due_at,storage_location_id").eq("current_relay_point_id", relayPointId).order("checked_in_at", { ascending: false }).limit(250),
    supabase.from("relay_storage_locations").select("id,code,kind,zone,capacity,max_weight_kg,status").eq("relay_point_id", relayPointId).order("code"),
    supabase.from("relay_scan_events").select("id,shipment_id,actor_id,scan_type,note,created_at").eq("relay_point_id", relayPointId).order("created_at", { ascending: false }).limit(30),
  ]);

  const point = pointData as unknown as PointRow | null;
  if (!point) return emptyRelayState();
  const inventory = (inventoryData ?? []) as unknown as InventoryRow[];
  const shipmentIds = inventory.map((row) => row.shipment_id);
  const scans = (scanData ?? []) as unknown as ScanRow[];
  const actorIds = [...new Set(scans.map((row) => row.actor_id))];
  const [shipmentsResult, packagesResult, addressesResult, profilesResult] = await Promise.all([
    shipmentIds.length ? supabase.from("shipments").select("id,tracking_code,destination_city,destination_country,latest_delivery_date,status").in("id", shipmentIds) : Promise.resolve({ data: [] }),
    shipmentIds.length ? supabase.from("shipment_packages").select("shipment_id,weight_kg,length_cm,width_cm,height_cm").in("shipment_id", shipmentIds) : Promise.resolve({ data: [] }),
    shipmentIds.length ? supabase.from("shipment_addresses").select("shipment_id,contact_name,type").in("shipment_id", shipmentIds).eq("type", "delivery") : Promise.resolve({ data: [] }),
    actorIds.length ? supabase.from("profiles").select("id,full_name").in("id", actorIds) : Promise.resolve({ data: [] }),
  ]);
  const shipments = new Map(((shipmentsResult.data ?? []) as unknown as ShipmentRow[]).map((row) => [row.id, row]));
  const packageDetails = new Map(((packagesResult.data ?? []) as unknown as PackageRow[]).map((row) => [row.shipment_id, row]));
  const recipients = new Map(((addressesResult.data ?? []) as unknown as AddressRow[]).map((row) => [row.shipment_id, row.contact_name]));
  const actors = new Map(((profilesResult.data ?? []) as unknown as ProfileRow[]).map((row) => [row.id, row.full_name]));
  const locationRows = (locationData ?? []) as unknown as LocationRow[];
  const locationCodes = new Map(locationRows.map((row) => [row.id, row.code]));
  const occupancy = new Map<string, number>();
  for (const row of inventory) if (row.status === "stored" && row.storage_location_id) occupancy.set(row.storage_location_id, (occupancy.get(row.storage_location_id) ?? 0) + 1);

  const packages = inventory.flatMap((row): RelayPackage[] => {
    const shipment = shipments.get(row.shipment_id);
    if (!shipment) return [];
    const parcel = packageDetails.get(row.shipment_id);
    const dimensions = { lengthCm: parcel?.length_cm ?? 1, widthCm: parcel?.width_cm ?? 1, heightCm: parcel?.height_cm ?? 1 };
    const weight = parcel?.weight_kg ?? 1;
    return [{
      id: row.shipment_id,
      trackingCode: shipment.tracking_code,
      sender: "Client Yobalelma",
      recipient: recipients.get(row.shipment_id) ?? "Destinataire",
      destination: `${shipment.destination_city}, ${shipment.destination_country}`,
      status: relayPackageStatus(row, shipment.status),
      weightKg: weight,
      expectedWeightKg: weight,
      dimensions,
      expectedDimensions: dimensions,
      locationCode: row.storage_location_id ? locationCodes.get(row.storage_location_id) : undefined,
      receivedAt: row.checked_in_at,
      dueAt: row.due_at ?? shipment.latest_delivery_date,
      photoCount: 0,
      qualityScore: row.quality_score ?? 100,
      otpRequired: shipment.status === "at_relay",
    }];
  });

  return {
    relayPoint: { id: point.id, name: point.name, code: point.city.toUpperCase().slice(0, 3), address: `${point.address_line1}, ${point.city}`, network: "Réseau Yobalelma", capacity: point.capacity_slots, openUntil: "20:00" },
    packages,
    locations: locationRows.map((row) => ({ id: row.id, code: row.code, kind: row.kind, zone: row.zone, capacity: row.capacity, occupied: occupancy.get(row.id) ?? 0, maxWeightKg: row.max_weight_kg, status: row.status })),
    incidents: packages.filter((item) => item.status === "anomaly").map((item) => ({ id: `incident-${item.id}`, type: "package_check", title: "Colis à vérifier avant remise", severity: "high", status: "open", at: item.receivedAt, trackingCode: item.trackingCode })),
    events: scans.map((row) => ({ id: row.id, at: row.created_at, action: row.scan_type, actor: actors.get(row.actor_id) ?? "Équipe Yobalelma", entity: shipments.get(row.shipment_id)?.tracking_code ?? "Colis", detail: cleanNote(row.note) })),
    notifications: [],
    sync: { pending: 0, lastSyncedAt: new Date().toISOString(), online: true },
  };
}

async function findAccessiblePoint(supabase: SupabaseClient, session: RelaySession) {
  const { data: membership } = await supabase.from("relay_point_members").select("relay_point_id").eq("profile_id", session.userId ?? "").eq("active", true).limit(1).maybeSingle();
  if (typeof membership?.relay_point_id === "string") return membership.relay_point_id;
  if (session.role !== "operations_manager") return undefined;
  const { data: point } = await supabase.from("relay_points").select("id").eq("status", "active").order("name").limit(1).maybeSingle();
  return typeof point?.id === "string" ? point.id : undefined;
}

function relayPackageStatus(inventory: InventoryRow, shipmentStatus: string): RelayPackageStatus {
  if (inventory.status === "released" || shipmentStatus === "delivered") return "handed_over";
  if (inventory.status === "exception") return "anomaly";
  if (shipmentStatus === "at_relay") return "awaiting_recipient";
  if (shipmentStatus === "collected_for_hub") return "awaiting_carrier";
  return "stored";
}

function cleanNote(note: string | null) {
  if (!note) return "Opération enregistrée";
  const visible = note.split(":").at(-1)?.trim();
  return visible || "Opération enregistrée";
}

function emptyRelayState(): RelayState {
  return {
    relayPoint: { id: "", name: "Point relais", code: "YBL", address: "", network: "Réseau Yobalelma", capacity: 0, openUntil: "—" },
    packages: [], locations: [], incidents: [], events: [], notifications: [],
    sync: { pending: 0, lastSyncedAt: new Date(0).toISOString(), online: true },
  };
}
