import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const workspaceRoot = path.resolve(appDir, "../..");

loadEnvConfig(workspaceRoot, false);

const EXPECTED_SUPABASE_URL = "https://rgcgtcycbiuhcaoaadbh.supabase.co";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.HUB_PILOT_PASSWORD;
const hubCode = process.env.HUB_PILOT_HUB_CODE ?? "DSS-DAKAR";

if (supabaseUrl !== EXPECTED_SUPABASE_URL || !serviceRoleKey) {
  throw new Error("Yobalelma Supabase service credentials are required.");
}

if (!password || password.length < 16) {
  throw new Error("HUB_PILOT_PASSWORD must contain at least 16 characters.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: hub, error: hubError } = await supabase
  .from("airport_hubs")
  .select("id, code")
  .eq("code", hubCode)
  .eq("is_active", true)
  .maybeSingle();

if (hubError || !hub) {
  throw hubError ?? new Error(`Active Hub ${hubCode} not found.`);
}

const accounts = [
  { email: "pilot.hub-agent@yobalelma.test", name: "Pilot Hub Agent", role: "hub_agent", title: "Hub agent" },
  { email: "pilot.hub-supervisor@yobalelma.test", name: "Pilot Hub Supervisor", role: "hub_supervisor", title: "Hub supervisor" },
  { email: "pilot.hub-manager@yobalelma.test", name: "Pilot Hub Manager", role: "hub_manager", title: "Hub manager" },
  { email: "pilot.operations-manager@yobalelma.test", name: "Pilot Operations Manager", role: "operations_manager", title: "Operations manager" },
];
const pilotUsers = new Map();

for (const account of accounts) {
  const user = await createOrUpdateUser(account);
  pilotUsers.set(account.role, user);
  await upsertProfile(user.id, account);

  if (account.role === "operations_manager") {
    await assertResult(supabase.from("operations_profiles").upsert({
      can_override_status: true,
      is_active: true,
      managed_country_codes: ["SN"],
      managed_hub_ids: [hub.id],
      profile_id: user.id,
    }), "operations profile");
  } else {
    await assertResult(supabase.from("hub_agent_profiles").upsert({
      can_validate_batches: account.role !== "hub_agent",
      hub_id: hub.id,
      is_active: true,
      profile_id: user.id,
      role_title: account.title,
    }), "Hub agent profile");
  }
}

const deniedAccount = {
  email: "pilot.hub-denied@yobalelma.test",
  name: "Pilot Hub Access Denied",
  role: "client",
  title: "Client without Hub access",
};
const deniedUser = await createOrUpdateUser(deniedAccount);
await upsertProfile(deniedUser.id, deniedAccount);

const fixtures = process.env.HUB_PILOT_AUTH_ONLY === "1" ? null : await seedOperationalFixtures();

console.log(JSON.stringify({
  accounts: accounts.map(({ email, role }) => ({ email, role })),
  negativeTestAccount: { email: deniedAccount.email, role: deniedAccount.role },
  fixtures,
  hub: hub.code,
  ok: true,
}));

async function createOrUpdateUser(account) {
  const existing = await findUser(account.email);
  const attributes = {
    app_metadata: { yobalelma_pilot: true },
    email_confirm: true,
    password,
    user_metadata: {
      full_name: account.name,
      primary_role: account.role,
      yobalelma_pilot: true,
    },
  };
  const { data, error } = existing
    ? await supabase.auth.admin.updateUserById(existing.id, attributes)
    : await supabase.auth.admin.createUser({ ...attributes, email: account.email });

  if (error || !data.user) throw error ?? new Error(`User ${account.email} was not returned.`);

  return data.user;
}

async function findUser(email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });

    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);

    if (user || data.users.length < 100) return user ?? null;
  }

  return null;
}

async function upsertProfile(userId, account) {
  await assertResult(supabase.from("profiles").upsert({
    account_status: "active",
    city: "Dakar",
    country: "Senegal",
    email: account.email,
    full_name: account.name,
    id: userId,
    is_verified: true,
    preferred_language: "fr",
    primary_role: account.role,
    role: account.role,
  }), "profile");
  await assertResult(supabase.from("user_roles").upsert({
    profile_id: userId,
    role_id: account.role,
  }), "role assignment");
}

async function assertResult(operation, label) {
  const { error } = await operation;

  if (error) throw new Error(`${label}: ${error.message}`);
}

async function seedOperationalFixtures() {
  const operator = pilotUsers.get("operations_manager");

  if (!operator) throw new Error("Operations pilot user is required for fixtures.");

  const receptionZone = await upsertOne("hub_zones", {
    code: "PILOT-REC",
    hub_id: hub.id,
    is_active: true,
    name: "Reception pilote",
    zone_type: "reception",
  }, "hub_id,code");
  const storageZone = await upsertOne("hub_zones", {
    code: "PILOT-STO",
    hub_id: hub.id,
    is_active: true,
    name: "Stockage pilote",
    zone_type: "storage",
  }, "hub_id,code");
  const preparationZone = await upsertOne("hub_zones", {
    code: "PILOT-PREP",
    hub_id: hub.id,
    is_active: true,
    name: "Preparation pilote",
    zone_type: "preparation",
  }, "hub_id,code");
  const receptionLocation = await seedLocation(receptionZone, "PILOT-REC-01", "reception");
  const storageLocation = await seedLocation(storageZone, "PILOT-STO-01", "shelf");
  const preparationLocation = await seedLocation(preparationZone, "PILOT-PREP-01", "preparation");
  const departureDate = dateFromToday(2);
  const arrivalDate = dateFromToday(2);
  let { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id")
    .eq("traveler_id", operator.id)
    .eq("notes", "yobalelma-hub-staging-pilot")
    .maybeSingle();

  if (tripError) throw tripError;

  if (trip) {
    const result = await supabase.from("trips").update({
      arrival_date: arrivalDate,
      available_weight_kg: 25,
      departure_date: departureDate,
      destination_city: "Paris",
      destination_country: "France",
      origin_city: "Dakar",
      origin_country: "Senegal",
      status: "planned",
    }).eq("id", trip.id).select("id").single();
    if (result.error) throw result.error;
    trip = result.data;
  } else {
    const result = await supabase.from("trips").insert({
      arrival_date: arrivalDate,
      available_weight_kg: 25,
      departure_date: departureDate,
      destination_city: "Paris",
      destination_country: "France",
      notes: "yobalelma-hub-staging-pilot",
      origin_city: "Dakar",
      origin_country: "Senegal",
      status: "planned",
      traveler_id: operator.id,
    }).select("id").single();
    if (result.error) throw result.error;
    trip = result.data;
  }

  await assertResult(supabase.from("traveler_documents").delete().eq("trip_id", trip.id), "old traveler document");
  await assertResult(supabase.from("traveler_documents").insert({
    arrival_airport: "CDG",
    arrival_date: arrivalDate,
    departure_airport: "DSS",
    departure_date: departureDate,
    document_number: "PILOT-HC403",
    file_path: `pilot/${trip.id}/ticket.pdf`,
    issuing_country: "SN",
    reviewed_at: new Date().toISOString(),
    reviewed_by: operator.id,
    status: "approved",
    traveler_id: operator.id,
    traveler_name: "Pilot Operations Manager",
    trip_id: trip.id,
  }), "traveler document");

  const shipments = [];
  for (const [trackingCode, weight, title] of [
    ["YBL-PILOT001", 4.2, "Textile pilote"],
    ["YBL-PILOT002", 2.4, "Artisanat pilote"],
  ]) {
    const shipment = await upsertOne("shipments", {
      confirmation_accepted_at: new Date().toISOString(),
      currency: "EUR",
      destination_city: "Paris",
      destination_country: "France",
      digital_twin: { pilot: true, source: "hub-staging" },
      estimated_price_cents: 3500,
      eta_max_days: 4,
      eta_min_days: 2,
      latest_delivery_date: dateFromToday(6),
      origin_city: "Dakar",
      origin_country: "Senegal",
      preferred_pickup_date: dateFromToday(1),
      scope: "international",
      sender_id: operator.id,
      service_level: "standard",
      status: "confirmed",
      tracking_code: trackingCode,
    }, "tracking_code");
    await upsertOne("shipment_packages", {
      category: "other",
      declared_value_cents: 25000,
      description: title,
      fragile: trackingCode.endsWith("2"),
      height_cm: 18,
      length_cm: 32,
      prohibited_items_confirmed: true,
      shipment_id: shipment.id,
      title,
      weight_kg: weight,
      width_cm: 24,
    }, "shipment_id");
    for (const [type, contactName, city, country] of [
      ["pickup", "Expediteur Pilote", "Dakar", "Senegal"],
      ["delivery", "Destinataire Pilote", "Paris", "France"],
    ]) {
      await upsertOne("shipment_addresses", {
        address_line1: "Adresse pilote",
        city,
        contact_name: contactName,
        contact_phone: "+221700000000",
        country,
        shipment_id: shipment.id,
        type,
      }, "shipment_id,type");
    }
    shipments.push(shipment);
  }

  let { data: route, error: routeError } = await supabase.from("collection_routes")
    .select("id").eq("name", "Collecte Hub staging pilote").eq("route_date", dateFromToday(0)).maybeSingle();
  if (routeError) throw routeError;
  if (!route) {
    const result = await supabase.from("collection_routes").insert({
      created_by: operator.id,
      driver_id: operator.id,
      name: "Collecte Hub staging pilote",
      route_date: dateFromToday(0),
      status: "completed",
    }).select("id").single();
    if (result.error) throw result.error;
    route = result.data;
  }
  const manifest = await upsertOne("collection_manifests", {
    code: "MAN-PILOT001",
    delivered_to_hub_at: new Date().toISOString(),
    route_id: route.id,
    sealed_at: new Date().toISOString(),
    sealed_by: operator.id,
  }, "code");
  for (const shipment of shipments) {
    await upsertOne("collection_manifest_items", {
      manifest_id: manifest.id,
      shipment_id: shipment.id,
    }, "manifest_id,shipment_id");
  }

  let { data: receipt, error: receiptError } = await supabase.from("hub_inbound_receipts")
    .select("id").eq("receipt_code", "HIR-PILOT001").maybeSingle();
  if (receiptError) throw receiptError;
  if (!receipt) {
    const result = await supabase.from("hub_inbound_receipts").insert({
      expected_count: shipments.length,
      hub_id: hub.id,
      manifest_id: manifest.id,
      note: "yobalelma-hub-staging-pilot",
      receipt_code: "HIR-PILOT001",
      status: "draft",
    }).select("id").single();
    if (result.error) throw result.error;
    receipt = result.data;
  }
  await assertResult(supabase.from("hub_inbound_receipt_items").delete().eq("receipt_id", receipt.id), "old receipt items");
  for (const shipment of shipments) {
    await assertResult(supabase.from("hub_inbound_receipt_items").insert({
      condition_note: null,
      photo_paths: [],
      receipt_id: receipt.id,
      shipment_id: shipment.id,
      status: "expected_at_hub",
      tracking_code: shipment.tracking_code,
    }), "receipt item");
  }
  await assertResult(supabase.from("hub_inbound_receipts").update({
    damaged_count: 0,
    expected_count: shipments.length,
    extra_count: 0,
    missing_count: 0,
    note: "yobalelma-hub-staging-pilot",
    received_at: null,
    received_by: null,
    received_count: 0,
    status: "draft",
  }).eq("id", receipt.id), "receipt reset");

  return {
    manifest: receipt.id,
    preparationLocation: preparationLocation.id,
    receptionLocation: receptionLocation.id,
    shipments: shipments.map((shipment) => shipment.id),
    storageLocation: storageLocation.id,
    trip: trip.id,
  };
}

async function seedLocation(zone, code, locationType) {
  const aisle = await upsertOne("hub_aisles", {
    code: `${zone.code}-A1`,
    hub_id: hub.id,
    is_active: true,
    name: `${zone.name} A1`,
    zone_id: zone.id,
  }, "zone_id,code");
  const shelf = await upsertOne("hub_shelves", {
    aisle_id: aisle.id,
    code: `${zone.code}-S1`,
    hub_id: hub.id,
    is_active: true,
    max_weight_kg: 250,
  }, "aisle_id,code");

  return upsertOne("hub_storage_locations", {
    aisle_id: aisle.id,
    code,
    hub_id: hub.id,
    is_active: true,
    is_pickable: true,
    location_type: locationType,
    max_weight_kg: 250,
    shelf_id: shelf.id,
    zone_id: zone.id,
  }, "hub_id,code");
}

async function upsertOne(table, values, onConflict) {
  const { data, error } = await supabase.from(table).upsert(values, { onConflict }).select("*").single();

  if (error || !data) throw error ?? new Error(`${table} did not return a row.`);

  return data;
}

function dateFromToday(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
