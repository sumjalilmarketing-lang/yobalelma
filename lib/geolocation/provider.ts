import { z } from "zod";

export const geoPointSchema = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) });
export type GeoPoint = z.infer<typeof geoPointSchema>;
export const structuredAddressSchema = z.object({
  formattedAddress: z.string().trim().min(2).max(500), addressLine1: z.string().trim().max(240).nullable(), addressLine2: z.string().trim().max(240).nullable(),
  landmark: z.string().trim().max(240).nullable(), neighborhood: z.string().trim().max(160).nullable(), commune: z.string().trim().max(160).nullable(), city: z.string().trim().min(1).max(160),
  region: z.string().trim().max(160).nullable(), postalCode: z.string().trim().max(32).nullable(), country: z.string().trim().min(2).max(120), countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), providerPlaceId: z.string().trim().min(1).max(500),
  locationType: z.enum(["address", "street", "neighborhood", "commune", "city", "landmark", "airport", "station", "relay", "hub", "other"]),
  geocodingProvider: z.string().trim().min(2).max(80), accuracyLevel: z.enum(["rooftop", "entrance", "street", "neighborhood", "city", "approximate"]), validationStatus: z.enum(["suggested", "selected", "user_confirmed", "provider_verified"]),
  plusCode: z.string().trim().max(32).nullable().optional(), distanceMeters: z.number().nonnegative().nullable().optional(),
});
export type StructuredAddress = z.infer<typeof structuredAddressSchema>;

export const addressSearchSchema = z.object({ query: z.string().trim().min(2).max(160), countryCode: z.string().length(2).optional(), city: z.string().trim().max(120).optional(), proximity: geoPointSchema.optional(), limit: z.number().int().min(1).max(8).default(6) });
export const routeRequestSchema = z.object({ origin: geoPointSchema, destination: geoPointSchema, vehicleType: z.enum(["bike", "scooter", "car", "van", "truck", "walking"]), departureAt: z.string().datetime({ offset: true }).optional() });
export type RouteRequest = z.infer<typeof routeRequestSchema>;
export type RouteResult = { distanceMeters: number; durationSeconds: number; trafficAware: boolean; provider: string; geometry: string | null };

export interface MapProvider {
  readonly id: string;
  autocomplete(input: z.input<typeof addressSearchSchema>, signal?: AbortSignal): Promise<StructuredAddress[]>;
  geocode(query: string, countryCode?: string): Promise<StructuredAddress[]>;
  reverseGeocode(point: z.input<typeof geoPointSchema>): Promise<StructuredAddress>;
  placeDetails(placeId: string): Promise<StructuredAddress>;
  route(input: RouteRequest): Promise<RouteResult>;
  distanceMatrix(origins: z.input<typeof geoPointSchema>[], destinations: z.input<typeof geoPointSchema>[], vehicleType: RouteRequest["vehicleType"]): Promise<Array<{ originIndex: number; destinationIndex: number; distanceMeters: number; durationSeconds: number }>>;
  nearbySearch(point: z.input<typeof geoPointSchema>, types: Array<"relay" | "hub">, radiusMeters: number): Promise<StructuredAddress[]>;
}

export type MapProviderTransport = { execute(operation: string, payload: unknown, signal?: AbortSignal): Promise<unknown> };
export type MapProviderMapping = {
  addresses(payload: unknown): StructuredAddress[]; address(payload: unknown): StructuredAddress; route(payload: unknown): RouteResult;
  matrix(payload: unknown): Array<{ originIndex: number; destinationIndex: number; distanceMeters: number; durationSeconds: number }>;
};

export class ExternalMapProvider implements MapProvider {
  constructor(readonly id: string, private readonly transport?: MapProviderTransport, private readonly mapping?: MapProviderMapping) {}
  private ready() { if (!this.transport || !this.mapping) throw new Error("MAP_PROVIDER_ACCESS_REQUIRED"); return { transport: this.transport, mapping: this.mapping }; }
  async autocomplete(input: z.input<typeof addressSearchSchema>, signal?: AbortSignal) { const ready = this.ready(); return ready.mapping.addresses(await ready.transport.execute("autocomplete", addressSearchSchema.parse(input), signal)).map((item) => structuredAddressSchema.parse(item)); }
  async geocode(query: string, countryCode?: string) { const ready = this.ready(); return ready.mapping.addresses(await ready.transport.execute("geocode", { query: z.string().trim().min(2).max(160).parse(query), countryCode })).map((item) => structuredAddressSchema.parse(item)); }
  async reverseGeocode(point: z.input<typeof geoPointSchema>) { const ready = this.ready(); return structuredAddressSchema.parse(ready.mapping.address(await ready.transport.execute("reverseGeocode", geoPointSchema.parse(point)))); }
  async placeDetails(placeId: string) { const ready = this.ready(); return structuredAddressSchema.parse(ready.mapping.address(await ready.transport.execute("placeDetails", { placeId: z.string().trim().min(1).max(500).parse(placeId) }))); }
  async route(input: RouteRequest) { const ready = this.ready(); return ready.mapping.route(await ready.transport.execute("route", routeRequestSchema.parse(input))); }
  async distanceMatrix(origins: z.input<typeof geoPointSchema>[], destinations: z.input<typeof geoPointSchema>[], vehicleType: RouteRequest["vehicleType"]) { const ready = this.ready(); return ready.mapping.matrix(await ready.transport.execute("distanceMatrix", { origins: z.array(geoPointSchema).max(25).parse(origins), destinations: z.array(geoPointSchema).max(25).parse(destinations), vehicleType })); }
  async nearbySearch(point: z.input<typeof geoPointSchema>, types: Array<"relay" | "hub">, radiusMeters: number) { const ready = this.ready(); return ready.mapping.addresses(await ready.transport.execute("nearbySearch", { point: geoPointSchema.parse(point), types: z.array(z.enum(["relay", "hub"])).min(1).parse(types), radiusMeters: z.number().min(100).max(100_000).parse(radiusMeters) })); }
}

export function haversineDistanceMeters(a: z.input<typeof geoPointSchema>, b: z.input<typeof geoPointSchema>) {
  const left = geoPointSchema.parse(a); const right = geoPointSchema.parse(b); const radius = 6_371_000; const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(right.latitude - left.latitude); const dLng = radians(right.longitude - left.longitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(left.latitude)) * Math.cos(radians(right.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(value));
}

export function rankAddressSuggestions(items: StructuredAddress[], context: { countryCode?: string; city?: string; proximity?: z.input<typeof geoPointSchema>; servedPlaceIds?: Set<string>; recentPlaceIds?: Set<string> }) {
  return items.map((item) => { const distance = context.proximity ? haversineDistanceMeters(context.proximity, item) : null; const score = (context.countryCode === item.countryCode ? 1000 : 0) + (context.city?.toLocaleLowerCase() === item.city.toLocaleLowerCase() ? 300 : 0) + (context.servedPlaceIds?.has(item.providerPlaceId) ? 150 : 0) + (context.recentPlaceIds?.has(item.providerPlaceId) ? 75 : 0) + (distance === null ? 0 : Math.max(0, 250 - distance / 1000)); return { ...item, distanceMeters: distance, rankingScore: score }; }).sort((a, b) => b.rankingScore - a.rankingScore).slice(0, 8);
}
