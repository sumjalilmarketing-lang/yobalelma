import { z } from "zod";
import { haversineDistanceMeters, type GeoPoint, type MapProvider } from "./provider";

export const realtimePositionSchema = z.object({
  clientEventId: z.string().uuid(), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(5000), speedKph: z.number().min(0).max(250).nullable().default(null),
  headingDegrees: z.number().min(0).max(360).nullable().default(null), batteryPercent: z.number().int().min(0).max(100).nullable().default(null),
  source: z.enum(["browser", "mobile", "vehicle_device"]).default("browser"), recordedAt: z.string().datetime({ offset: true }),
  networkStatus: z.enum(["online", "degraded", "offline_replay"]).default("online"),
});
export type RealtimePosition = z.infer<typeof realtimePositionSchema>;

export function adaptiveTrackingInterval(input: { speedKph: number | null; batteryPercent: number | null; background: boolean; networkStatus: "online" | "degraded" | "offline" }) {
  if (input.networkStatus === "offline") return 60_000;
  if (input.background || (input.batteryPercent !== null && input.batteryPercent <= 15)) return 60_000;
  if ((input.speedKph ?? 0) >= 5) return input.networkStatus === "degraded" ? 20_000 : 8_000;
  return 30_000;
}

export function detectPositionAnomalies(previous: RealtimePosition | null, current: RealtimePosition) {
  const codes: string[] = [];
  if (current.accuracyMeters > 250) codes.push("imprecise");
  if (current.speedKph !== null && current.speedKph > 220) codes.push("impossible_speed");
  if (previous) {
    const elapsedSeconds = (Date.parse(current.recordedAt) - Date.parse(previous.recordedAt)) / 1000;
    if (elapsedSeconds <= 0) codes.push("non_monotonic_timestamp");
    else {
      const derivedSpeed = haversineDistanceMeters(previous, current) / elapsedSeconds * 3.6;
      if (derivedSpeed > 250) codes.push("impossible_displacement");
      if (current.speedKph !== null && derivedSpeed > 30 && Math.abs(derivedSpeed - current.speedKph) > 100) codes.push("speed_mismatch");
    }
  }
  return [...new Set(codes)];
}

export type Geofence = { id: string; center: GeoPoint; radiusMeters: number; type: "pickup" | "relay" | "hub" | "delivery" | "restricted" | "sensitive" };
export function evaluateGeofences(previous: GeoPoint | null, current: GeoPoint, fences: Geofence[]) {
  const events: Array<{ geofenceId:string; eventType:"restricted_entry"|"entered"|"exited"; distanceMeters:number; requiresProof:true }>=[];
  for(const fence of fences){
    const distanceMeters = haversineDistanceMeters(current, fence.center);
    const wasInside = previous ? haversineDistanceMeters(previous, fence.center) <= fence.radiusMeters : false;
    const isInside = distanceMeters <= fence.radiusMeters;
    if(isInside&&!wasInside) events.push({geofenceId:fence.id,eventType:fence.type==="restricted"?"restricted_entry":"entered",distanceMeters,requiresProof:true});
    else if(!isInside&&wasInside) events.push({geofenceId:fence.id,eventType:"exited",distanceMeters,requiresProof:true});
  }
  return events;
}

export async function estimateArrival(provider: MapProvider | null, origin: GeoPoint, destination: GeoPoint, vehicleType: "bike" | "scooter" | "car" | "van" | "truck", now = new Date()) {
  if (!provider) return { available: false as const, reason: "ROUTING_PROVIDER_REQUIRED" as const };
  const route = await provider.route({ origin, destination, vehicleType });
  return { available: true as const, distanceMeters: route.distanceMeters, durationSeconds: route.durationSeconds, estimatedArrivalAt: new Date(now.getTime() + route.durationSeconds * 1000).toISOString(), trafficAware: route.trafficAware, provider: route.provider };
}
