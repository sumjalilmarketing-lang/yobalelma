import { describe, expect, it } from "vitest";
import { collectProviderSnapshot, OrangeRelayProvider, partnerRelaySchema, relaySourceHash } from "@/lib/partners/relay-provider";

const relay = { externalId: "OR-SN-001", name: "Point partenaire", addressLine1: "Avenue principale", city: "Dakar", countryCode: "sn", capacitySlots: 40, active: true };

describe("Orange relay integration foundation", () => {
  it("fails closed without the official transport and mapping", async () => {
    await expect(new OrangeRelayProvider().listRelays()).rejects.toThrow("ORANGE_RELAY_ACCESS_REQUIRED");
  });

  it("normalizes and validates mapped official records", async () => {
    const provider = new OrangeRelayProvider(async () => ({ records: [relay] }), (payload) => ({ relays: (payload as { records: typeof relay[] }).records.map((item) => partnerRelaySchema.parse(item)) }));
    const result = await collectProviderSnapshot(provider);
    expect(result[0].countryCode).toBe("SN");
    expect(result[0].availability).toBe("unknown");
    expect(relaySourceHash(result[0])).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("rejects invalid coordinates before persistence", () => {
    expect(() => partnerRelaySchema.parse({ ...relay, latitude: 120 })).toThrow();
  });

  it("stops looping provider cursors", async () => {
    const provider = { id: "orange", listRelays: async () => ({ relays: [], nextCursor: "same" }) };
    await expect(collectProviderSnapshot(provider)).rejects.toThrow("RELAY_PROVIDER_CURSOR_LOOP");
  });
});
