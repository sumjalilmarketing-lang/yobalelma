import "server-only";

import { z } from "zod";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import type { CollectionMission, CollectionSession, CollectionState, MissionStatus, PackageItem } from "./types";

const routeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  route_date: z.string().min(1),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]),
  created_at: z.string(),
  updated_at: z.string(),
  vehicle_id: z.string().uuid().nullable(), route_kind: z.string(), optimized_distance_km: z.number().nullable(), estimated_duration_minutes: z.number().int().nullable(),
});
const stopSchema = z.object({
  id: z.string().uuid(), route_id: z.string().uuid(), stop_order: z.number().int().positive(),
  status: z.enum(["pending", "arrived", "completed", "skipped"]), arrived_at: z.string().nullable(), completed_at: z.string().nullable(),
  relay_points: z.object({ name: z.string(), address_line1: z.string(), city: z.string(), country: z.string() }).nullable(),
});

export function emptyCollectionState(loadError?: string): CollectionState {
  return { source: loadError ? "unavailable" : "live", loadError, missions: [], packages: [], vehicle: null, incidents: [], events: [], notifications: [], messages: [], gps: null, sync: { pending: 0, online: !loadError } };
}

export async function loadCollectionState(session: CollectionSession): Promise<CollectionState> {
  if (session.source !== "supabase" || !session.userId) return emptyCollectionState("Connectez-vous avec votre compte professionnel pour charger vos missions.");
  const client = await tryCreateSupabaseServerClient();
  if (!client) return emptyCollectionState("Les données opérationnelles sont momentanément indisponibles.");

  const { data: auth } = await client.auth.getUser();
  if (!auth.user || auth.user.id !== session.userId) return emptyCollectionState("Votre session doit être renouvelée.");

  const [routesResult, stopsResult, manifestsResult, notificationsResult, vehiclesResult] = await Promise.all([
    client.from("collection_routes").select("id,name,route_date,status,created_at,updated_at,vehicle_id,route_kind,optimized_distance_km,estimated_duration_minutes").order("route_date", { ascending: false }).limit(25),
    client.from("collection_route_stops").select("id,route_id,stop_order,status,arrived_at,completed_at,relay_points(name,address_line1,city,country)").order("stop_order", { ascending: true }).limit(250),
    client.from("collection_manifests").select("id,code,route_id,incident_note,sealed_at,delivered_to_hub_at").order("created_at", { ascending: false }).limit(100),
    client.from("notifications").select("id,title,body,created_at,read_at").eq("recipient_id", session.userId).order("created_at", { ascending: false }).limit(30),
    client.from("collection_vehicles").select("id,plate,model,vehicle_type,capacity_kg,mileage_km,fuel_percent,status,next_maintenance_km,assigned_driver_id").limit(50),
  ]);
  const firstError = [routesResult.error, stopsResult.error, manifestsResult.error, notificationsResult.error, vehiclesResult.error].find(Boolean);
  if (firstError) return emptyCollectionState("Les missions n’ont pas pu être chargées. Réessayez dans quelques instants.");

  const routes = z.array(routeSchema).safeParse(routesResult.data ?? []);
  const stops = z.array(stopSchema).safeParse(stopsResult.data ?? []);
  if (!routes.success || !stops.success) return emptyCollectionState("Les données reçues ne sont pas conformes au format attendu.");

  const manifestRows = manifestsResult.data ?? [];
  const manifestIds = manifestRows.map((item) => item.id);
  const itemsResult = manifestIds.length
    ? await client.from("collection_manifest_items").select("id,manifest_id,shipment_id,incident_note,scanned_at").in("manifest_id", manifestIds).limit(500)
    : { data: [], error: null };
  if (itemsResult.error) return emptyCollectionState("Le contenu des tournées n’a pas pu être chargé.");
  const shipmentIds = [...new Set((itemsResult.data ?? []).map((item) => item.shipment_id))];
  const shipmentsResult = shipmentIds.length
    ? await client.from("shipments").select("id,tracking_code,destination_city,destination_country,status,digital_twin").in("id", shipmentIds)
    : { data: [], error: null };
  if (shipmentsResult.error) return emptyCollectionState("Les colis affectés n’ont pas pu être chargés.");

  const itemsByManifest = new Map<string, typeof itemsResult.data>();
  for (const item of itemsResult.data ?? []) itemsByManifest.set(item.manifest_id, [...(itemsByManifest.get(item.manifest_id) ?? []), item]);
  const manifestsByRoute = new Map<string, typeof manifestRows>();
  for (const manifest of manifestRows) manifestsByRoute.set(manifest.route_id, [...(manifestsByRoute.get(manifest.route_id) ?? []), manifest]);
  const shipmentById = new Map((shipmentsResult.data ?? []).map((shipment) => [shipment.id, shipment]));
  const stopsByRoute = new Map<string, z.infer<typeof stopSchema>[]>();
  for (const stop of stops.data) stopsByRoute.set(stop.route_id, [...(stopsByRoute.get(stop.route_id) ?? []), stop]);

  const missions: CollectionMission[] = routes.data.map((route) => {
    const routeStops = stopsByRoute.get(route.id) ?? [];
    const manifests = manifestsByRoute.get(route.id) ?? [];
    const routeItems = manifests.flatMap((manifest) => itemsByManifest.get(manifest.id) ?? []);
    const completed = routeStops.filter((stop) => stop.status === "completed").length;
    const mappedStatus: Record<typeof route.status, MissionStatus> = { planned: "assigned", in_progress: "en_route", completed: "completed", cancelled: "incident" };
    return {
      id: route.id, code: route.name, title: route.name,
      origin: routeStops[0]?.relay_points?.name ?? "Origine à confirmer",
      destination: routeStops.at(-1)?.relay_points?.name ?? "Destination à confirmer",
      status: mappedStatus[route.status], priority: "normal", distanceKm: route.optimized_distance_km ?? 0, durationMinutes: route.estimated_duration_minutes ?? 0,
      packageCount: routeItems.length, batchCount: manifests.length, weightKg: 0,
      progress: routeStops.length ? Math.round(completed / routeStops.length * 100) : route.status === "completed" ? 100 : 0,
      assignedAt: route.created_at, scheduledStart: `${route.route_date}T00:00:00.000Z`, optimized: false, carbonKg: 0,
      stops: routeStops.map((stop) => ({ id: stop.id, kind: "relay", name: stop.relay_points?.name ?? "Point logistique", address: stop.relay_points ? `${stop.relay_points.address_line1}, ${stop.relay_points.city}, ${stop.relay_points.country}` : "Adresse indisponible", eta: stop.arrived_at ?? stop.completed_at ?? "", status: stop.status === "skipped" ? "pending" : stop.status, expectedPackages: 0, scannedPackages: 0, signatureRequired: true })),
    };
  });
  const packages: PackageItem[] = (itemsResult.data ?? []).flatMap((item) => {
    const shipment = shipmentById.get(item.shipment_id); if (!shipment) return [];
    const twin = shipment.digital_twin && typeof shipment.digital_twin === "object" && !Array.isArray(shipment.digital_twin) ? shipment.digital_twin as Record<string, unknown> : {};
    return [{ id: shipment.id, trackingCode: shipment.tracking_code, batchCode: manifestRows.find((manifest) => manifest.id === item.manifest_id)?.code, status: item.incident_note ? "anomaly" : "expected", weightKg: typeof twin.weightKg === "number" ? twin.weightKg : 0, destination: `${shipment.destination_city}, ${shipment.destination_country}`, photoCount: 0 } satisfies PackageItem];
  });
  const notifications = (notificationsResult.data ?? []).map((item) => ({ id: item.id, title: item.title, message: item.body, at: item.created_at, read: Boolean(item.read_at) }));
  const activeRoute = routes.data.find((route) => route.status === "in_progress") ?? routes.data.find((route) => route.status === "planned");
  const vehicleRow = activeRoute?.vehicle_id ? (vehiclesResult.data ?? []).find((item) => item.id === activeRoute.vehicle_id) : (vehiclesResult.data ?? []).find((item) => item.assigned_driver_id === session.userId);
  const vehicle = vehicleRow ? { id: vehicleRow.id, plate: vehicleRow.plate, model: vehicleRow.model, type: vehicleRow.vehicle_type === "truck" ? "truck" as const : "van" as const, capacityKg: vehicleRow.capacity_kg, loadKg: packages.reduce((sum, item) => sum + item.weightKg, 0), mileageKm: vehicleRow.mileage_km, fuelPercent: vehicleRow.fuel_percent, fuelConsumptionL100Km: 0, status: vehicleRow.status === "maintenance" ? "maintenance" as const : vehicleRow.status === "inspection" || vehicleRow.status === "inactive" ? "inspection" as const : "ready" as const, nextMaintenanceKm: vehicleRow.next_maintenance_km ?? vehicleRow.mileage_km, inspectionItems: [] } : null;
  const gpsResult = activeRoute ? await client.from("collection_gps_positions").select("latitude,longitude,accuracy_meters,speed_kph,recorded_at").eq("route_id", activeRoute.id).order("recorded_at", { ascending: false }).limit(1).maybeSingle() : { data: null, error: null };
  if (gpsResult.error) return emptyCollectionState("La position de la tournée n’a pas pu être chargée.");
  const gps = gpsResult.data ? { position: { lat: gpsResult.data.latitude, lng: gpsResult.data.longitude, label: "Dernière position confirmée" }, speedKph: gpsResult.data.speed_kph ?? 0, accuracyMeters: gpsResult.data.accuracy_meters ?? 0, updatedAt: gpsResult.data.recorded_at } : null;
  return { ...emptyCollectionState(), missions, packages, notifications, vehicle, gps, sync: { pending: 0, lastSyncedAt: gps?.updatedAt, online: true } };
}
