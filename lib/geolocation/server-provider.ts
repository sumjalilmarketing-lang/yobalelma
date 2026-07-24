import "server-only";
import { ExternalMapProvider, structuredAddressSchema, type MapProviderMapping, type MapProviderTransport, type RouteResult } from "./provider";

const mapping: MapProviderMapping = {
  addresses(payload) { return structuredAddressSchema.array().max(8).parse(payload); },
  address(payload) { return structuredAddressSchema.parse(payload); },
  route(payload) { const value = payload as RouteResult; if (!Number.isFinite(value?.distanceMeters) || !Number.isFinite(value?.durationSeconds)) throw new Error("MAP_PROVIDER_INVALID_ROUTE"); return value; },
  matrix(payload) { return (payload as Array<{ originIndex: number; destinationIndex: number; distanceMeters: number; durationSeconds: number }>).map((item) => ({ ...item, distanceMeters: Number(item.distanceMeters), durationSeconds: Number(item.durationSeconds) })); },
};

export function createServerMapProvider() {
  const baseUrl = process.env.MAP_PROVIDER_GATEWAY_URL; const token = process.env.MAP_PROVIDER_SERVER_TOKEN; const provider = process.env.MAP_PROVIDER;
  if (!baseUrl || !token || !provider) return new ExternalMapProvider(provider || "unconfigured");
  const url = new URL(baseUrl); if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("MAP_PROVIDER_HTTPS_REQUIRED");
  const transport: MapProviderTransport = { async execute(operation, payload, signal) { const response = await fetch(new URL(`/v1/${operation}`, url), { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "x-map-provider": provider }, body: JSON.stringify(payload), signal, cache: "no-store" }); if (!response.ok) throw new Error(response.status === 429 ? "MAP_PROVIDER_RATE_LIMITED" : "MAP_PROVIDER_UNAVAILABLE"); return response.json(); } };
  return new ExternalMapProvider(provider, transport, mapping);
}
