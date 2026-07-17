import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { loadEnvConfig } = nextEnv;
const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
loadEnvConfig(path.resolve(appDir, "../.."), false);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.HUB_PILOT_PASSWORD;
if (url !== "https://rgcgtcycbiuhcaoaadbh.supabase.co" || !anonKey || !serviceKey || !password) {
  throw new Error("Yobalelma staging credentials and HUB_PILOT_PASSWORD are required.");
}

const service = createClient(url, serviceKey, { auth: { persistSession: false } });
const clients = Object.fromEntries(await Promise.all([
  ["agent", "pilot.hub-agent@yobalelma.test"],
  ["supervisor", "pilot.hub-supervisor@yobalelma.test"],
  ["denied", "pilot.hub-denied@yobalelma.test"],
].map(async ([name, email]) => {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${name} sign-in failed.`);
  return [name, client];
})));

const { data: hub } = await service.from("airport_hubs").select("id").eq("code", "DSS-DAKAR").single();
const { data: manifest } = await service.from("collection_manifests").select("id").eq("code", "MAN-PILOT001").single();
const { data: shipment } = await service.from("shipments").select("id,tracking_code").eq("tracking_code", "YBL-PILOT002").single();
const { data: trip } = await service.from("trips").select("id,traveler_id,departure_date,destination_city,destination_country,origin_city,origin_country").eq("notes", "yobalelma-hub-staging-pilot").single();
if (!hub || !manifest || !shipment || !trip) throw new Error("Pilot fixture is incomplete.");

const { data: inventoryBefore } = await service.from("hub_inventory").select("id,status,current_location_id,current_batch_id").eq("shipment_id", shipment.id).eq("active", true).maybeSingle();
const receiptIds = [];
const batchIds = [];

try {
  const raceReceipt = await createReceipt("RACE");
  const duplicateScans = await Promise.allSettled([
    clients.agent.rpc("scan_hub_inbound_item", scanArgs(raceReceipt.id, "received_at_hub", null)),
    clients.supervisor.rpc("scan_hub_inbound_item", scanArgs(raceReceipt.id, "received_at_hub", null)),
  ]);
  assertRpcResults(duplicateScans, "concurrent scans");

  const { count: itemCount } = await service.from("hub_inbound_receipt_items")
    .select("id", { count: "exact", head: true }).eq("receipt_id", raceReceipt.id).eq("tracking_code", shipment.tracking_code);
  const { data: countedReceipt } = await service.from("hub_inbound_receipts").select("received_count").eq("id", raceReceipt.id).single();
  if (itemCount !== 1 || countedReceipt?.received_count !== 1) throw new Error("Concurrent scan was not idempotent.");

  const duplicateConfirmations = await Promise.allSettled([
    clients.agent.rpc("confirm_hub_inbound_receipt", { p_receipt_id: raceReceipt.id }),
    clients.supervisor.rpc("confirm_hub_inbound_receipt", { p_receipt_id: raceReceipt.id }),
  ]);
  assertRpcResults(duplicateConfirmations, "concurrent confirmations");

  const mismatchReceipt = await createReceipt("MISMATCH");
  const mismatch = await clients.agent.rpc("scan_hub_inbound_item", scanArgs(mismatchReceipt.id, "damaged", null));
  if (!mismatch.error) throw new Error("An unjustified manifest mismatch was accepted.");

  const { data: inventoryBeforeDeniedWrite } = await service.from("hub_inventory").select("status").eq("shipment_id", shipment.id).eq("active", true).maybeSingle();
  const deniedWrite = await clients.denied.from("hub_inventory").update({ status: "in_storage" }).eq("shipment_id", shipment.id);
  const { data: inventoryAfterDeniedWrite } = await service.from("hub_inventory").select("status").eq("shipment_id", shipment.id).eq("active", true).maybeSingle();
  if (!deniedWrite.error && inventoryAfterDeniedWrite?.status !== inventoryBeforeDeniedWrite?.status) throw new Error("Unauthorized inventory write was accepted.");
  const { data: deniedDocuments, error: deniedDocumentsError } = await clients.denied.from("traveler_documents").select("id");
  if (deniedDocumentsError || deniedDocuments?.length) throw new Error("Protected traveler documents were exposed.");
  const deniedRpc = await clients.denied.rpc("scan_hub_inbound_item", scanArgs(mismatchReceipt.id, "received_at_hub", null));
  if (!deniedRpc.error) throw new Error("Unauthorized Hub RPC was accepted.");

  const capacityBatch = await createBatch(10);
  const duplicateReservations = await Promise.allSettled([
    clients.agent.rpc("reserve_hub_batch_capacity_v2", { p_batch_id: capacityBatch.id, p_reserved_weight_kg: 2.4, p_shipment_id: shipment.id }),
    clients.supervisor.rpc("reserve_hub_batch_capacity_v2", { p_batch_id: capacityBatch.id, p_reserved_weight_kg: 2.4, p_shipment_id: shipment.id }),
  ]);
  assertRpcResults(duplicateReservations, "concurrent reservations");
  const { count: reservationCount } = await service.from("capacity_reservations").select("id", { count: "exact", head: true }).eq("batch_id", capacityBatch.id).eq("shipment_id", shipment.id);
  if (reservationCount !== 1) throw new Error("Concurrent capacity reservation was not idempotent.");

  const secondBatch = await createBatch(10);
  const secondBatchReservation = await clients.agent.rpc("reserve_hub_batch_capacity_v2", { p_batch_id: secondBatch.id, p_reserved_weight_kg: 2.4, p_shipment_id: shipment.id });
  if (!secondBatchReservation.error) throw new Error("A shipment was accepted in two active batches.");
  await service.from("hub_batches").delete().eq("id", capacityBatch.id);
  batchIds.splice(batchIds.indexOf(capacityBatch.id), 1);
  const lowCapacity = await clients.agent.rpc("reserve_hub_batch_capacity_v2", { p_batch_id: secondBatch.id, p_reserved_weight_kg: 20, p_shipment_id: shipment.id });
  if (!lowCapacity.error) throw new Error("Insufficient capacity was accepted.");

  const qrBatch = await createBatch(10);
  const qr = await clients.supervisor.rpc("create_handover_qr_token", { p_batch_id: qrBatch.id, p_expires_in_minutes: 10, p_token_type: "origin_pickup" });
  const token = qr.data?.[0]?.token;
  if (qr.error || !token) throw new Error(`QR security fixture could not be created: ${qr.error?.message ?? "empty token"}`);
  const wrongTraveler = await clients.agent.rpc("record_hub_handover_event", { p_batch_id: qrBatch.id, p_verified_document: false, p_verified_identity: false, p_verified_ticket: false });
  if (!wrongTraveler.error) throw new Error("Handover without traveler identity checks was accepted.");
  const firstQrScan = await clients.agent.rpc("scan_handover_qr_token", { p_expected_token_type: "origin_pickup", p_token: token });
  if (firstQrScan.error) throw new Error("First QR scan failed.");
  const secondQrScan = await clients.supervisor.rpc("scan_handover_qr_token", { p_expected_token_type: "origin_pickup", p_token: token });
  if (!secondQrScan.error) throw new Error("A one-use QR was accepted twice.");

  const { count: auditCount } = await service.from("audit_log_events")
    .select("id", { count: "exact", head: true }).eq("entity_id", raceReceipt.id);
  if (!auditCount || auditCount < 2) throw new Error("Expected audit events were not created.");

  console.log(JSON.stringify({
    auditEvents: auditCount,
    concurrentConfirmations: "idempotent",
    concurrentScans: "idempotent",
    concurrentReservations: "idempotent",
    insufficientCapacity: "rejected",
    manifestMismatch: "rejected",
    protectedDocuments: "not exposed",
    qrDoubleScan: "rejected",
    rlsUnauthorizedRpc: "rejected",
    rlsUnauthorizedWrite: "rejected",
    shipmentInTwoBatches: "rejected",
    travelerIdentityMissing: "rejected",
  }, null, 2));
} finally {
  if (receiptIds.length) await service.from("hub_inbound_receipts").delete().in("id", receiptIds);
  if (batchIds.length) await service.from("hub_batches").delete().in("id", batchIds);
  if (inventoryBefore) {
    await service.from("hub_inventory").update({
      current_batch_id: inventoryBefore.current_batch_id,
      current_location_id: inventoryBefore.current_location_id,
      status: inventoryBefore.status,
    }).eq("id", inventoryBefore.id);
  }
}

async function createBatch(capacityKg) {
  const suffix = `${Date.now().toString(36)}${batchIds.length}`.toUpperCase().slice(-8);
  const { data, error } = await service.from("hub_batches").insert({
    capacity_kg: capacityKg,
    code: `HUB-T${suffix}`,
    departure_date: trip.departure_date,
    destination_city: trip.destination_city,
    destination_country: trip.destination_country,
    destination_hub: `${trip.destination_city}, ${trip.destination_country}`,
    hub_id: hub.id,
    origin_hub: `${trip.origin_city}, ${trip.origin_country}`,
    status: "open",
    traveler_id: trip.traveler_id,
    trip_id: trip.id,
  }).select("id").single();
  if (error || !data) throw error ?? new Error("Batch fixture was not created.");
  batchIds.push(data.id);
  return data;
}

async function createReceipt(label) {
  const code = `HIR-${label}-${Date.now().toString(36).toUpperCase()}`;
  const { data, error } = await service.from("hub_inbound_receipts").insert({
    expected_count: 1,
    hub_id: hub.id,
    manifest_id: manifest.id,
    note: "hub staging security validation",
    receipt_code: code,
    status: "draft",
  }).select("id").single();
  if (error || !data) throw error ?? new Error("Receipt fixture was not created.");
  receiptIds.push(data.id);
  const item = await service.from("hub_inbound_receipt_items").insert({
    photo_paths: [],
    receipt_id: data.id,
    shipment_id: shipment.id,
    status: "expected_at_hub",
    tracking_code: shipment.tracking_code,
  });
  if (item.error) throw item.error;
  return data;
}

function scanArgs(receiptId, status, note) {
  return { p_note: note, p_photo_paths: [], p_receipt_id: receiptId, p_status: status, p_tracking_code: shipment.tracking_code };
}

function assertRpcResults(results, label) {
  const failures = results.filter((result) => result.status === "rejected" || result.value.error);
  if (failures.length) {
    const reasons = failures.map((result) => result.status === "rejected" ? String(result.reason) : result.value.error.message);
    throw new Error(`${label} failed: ${reasons.join(" | ")}`);
  }
}
