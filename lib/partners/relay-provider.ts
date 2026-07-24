import { createHash } from "node:crypto";
import { z } from "zod";

export const partnerRelaySchema = z.object({
  externalId: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(200),
  addressLine1: z.string().trim().min(1).max(300),
  city: z.string().trim().min(1).max(120),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  postalCode: z.string().trim().max(32).nullable().optional(),
  contactName: z.string().trim().max(160).nullable().optional(),
  contactPhone: z.string().trim().max(40).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  openingHours: z.record(z.string(), z.array(z.object({ opensAt: z.string(), closesAt: z.string() }))).default({}),
  services: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  capacitySlots: z.number().int().positive().max(100_000),
  availability: z.enum(["available", "limited", "unavailable", "unknown"]).default("unknown"),
  active: z.boolean(),
  externalUpdatedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export type PartnerRelay = z.infer<typeof partnerRelaySchema>;

export type RelayProviderPage = {
  relays: PartnerRelay[];
  nextCursor?: string;
};

export interface RelayLocationProvider {
  readonly id: string;
  listRelays(cursor?: string): Promise<RelayProviderPage>;
}

export type OrangeRelayTransport = (cursor?: string) => Promise<unknown>;

/**
 * Orange's payload and pagination contract must be supplied from the official
 * partnership documentation. Keeping transport and mapping injected prevents
 * guessed endpoints or field names from entering production.
 */
export class OrangeRelayProvider implements RelayLocationProvider {
  readonly id = "orange";

  constructor(
    private readonly transport?: OrangeRelayTransport,
    private readonly mapPage?: (payload: unknown) => RelayProviderPage,
  ) {}

  async listRelays(cursor?: string): Promise<RelayProviderPage> {
    if (!this.transport || !this.mapPage) {
      throw new Error("ORANGE_RELAY_ACCESS_REQUIRED");
    }
    const page = this.mapPage(await this.transport(cursor));
    return {
      ...page,
      relays: page.relays.map((relay) => partnerRelaySchema.parse(relay)),
    };
  }
}

export async function collectProviderSnapshot(provider: RelayLocationProvider, maximumRelays = 20_000) {
  const relays: PartnerRelay[] = [];
  const cursors = new Set<string>();
  let cursor: string | undefined;
  do {
    if (cursor) {
      if (cursors.has(cursor)) throw new Error("RELAY_PROVIDER_CURSOR_LOOP");
      cursors.add(cursor);
    }
    const page = await provider.listRelays(cursor);
    relays.push(...page.relays);
    if (relays.length > maximumRelays) throw new Error("RELAY_PROVIDER_LIMIT_EXCEEDED");
    cursor = page.nextCursor;
  } while (cursor);
  return relays;
}

export function relaySourceHash(relay: PartnerRelay) {
  return createHash("sha256").update(JSON.stringify(partnerRelaySchema.parse(relay))).digest("hex");
}
