import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { adTargetingSchema, advertiserDraftSchema, allowedAdSurfaces, controlledCreativeSchema, countryExperienceSchema } from "../apps/admin-app/src/lib/experience-schemas";

describe("expérience internationale", () => {
  it("valide une configuration pays versionnée", () => {
    expect(countryExperienceSchema.safeParse({ countryCode: "SN", version: 1, defaultLocale: "fr", availableLocales: ["fr", "en"], currencyCode: "XOF", timeZone: "Africa/Dakar", unitSystem: "metric" }).success).toBe(true);
  });

  it("refuse le code exécutable et les liens non sécurisés", () => {
    const base = { campaignId: crypto.randomUUID(), placementId: crypto.randomUUID(), headline: "Offre locale", body: "Une offre partenaire", ctaLabel: "Découvrir", destinationUrl: "https://partner.example/offre" };
    expect(controlledCreativeSchema.safeParse(base).success).toBe(true);
    expect(controlledCreativeSchema.safeParse({ ...base, body: "<script>alert(1)</script>" }).success).toBe(false);
    expect(controlledCreativeSchema.safeParse({ ...base, destinationUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(controlledCreativeSchema.safeParse({ ...base, destinationUrl: "http://partner.example" }).success).toBe(false);
  });

  it("interdit les critères sensibles et les applications opérationnelles", () => {
    const targeting = { countries: ["SN"], regions: [], cities: [], locales: ["fr"], userTypes: ["client"], shipmentTypes: [], corridors: [], devices: ["mobile"], partners: [] };
    expect(adTargetingSchema.safeParse(targeting).success).toBe(true);
    expect(adTargetingSchema.safeParse({ ...targeting, religion: ["x"] }).success).toBe(false);
    expect(allowedAdSurfaces).toEqual(["user_app", "website", "mobile_app"]);
    expect(allowedAdSurfaces).not.toContain("hub_app");
    expect(allowedAdSurfaces).not.toContain("relay_app");
    expect(allowedAdSurfaces).not.toContain("collection_app");
  });

  it("valide les domaines annonceurs sans accepter une URL ou un script", () => {
    const base = { legalName: "Partenaire Exemple SA", displayName: "Partenaire Exemple", billingCountry: "SN", allowedDomains: ["partner.example"] };
    expect(advertiserDraftSchema.safeParse(base).success).toBe(true);
    expect(advertiserDraftSchema.safeParse({ ...base, allowedDomains: ["https://partner.example"] }).success).toBe(false);
    expect(advertiserDraftSchema.safeParse({ ...base, allowedDomains: ["javascript:alert.example"] }).success).toBe(false);
  });

  it("garde les sélecteurs de localisation dans les réglages", () => {
    const panel = readFileSync("components/settings/experience-settings-panel.tsx", "utf8");
    expect(panel).toContain("LocalizationSwitcher");
    for (const path of ["components/layout/site-header.tsx", "apps/hub-app/src/components/hub-shell.tsx", "apps/relay-app/src/components/relay-shell.tsx", "apps/collection-app/src/components/collection-shell.tsx"]) {
      expect(readFileSync(path, "utf8")).not.toContain("LocalizationSwitcher");
    }
  });
});
