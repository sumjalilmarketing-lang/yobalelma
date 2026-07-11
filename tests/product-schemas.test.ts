import { describe, expect, it } from "vitest";
import { getSafeAuthRedirect } from "@/lib/auth/redirect";
import { parcelRequestSchema } from "@/lib/validation/parcel-request";
import {
  identityVerificationSchema,
  profileSchema,
} from "@/lib/validation/profile";
import { tripSchema } from "@/lib/validation/trip";

describe("product validation", () => {
  it("accepts a valid parcel request", () => {
    const result = parcelRequestSchema.parse({
      originCity: "Paris",
      originCountry: "France",
      destinationCity: "Dakar",
      destinationCountry: "Senegal",
      packageType: "Documents",
      weightKg: "2.5",
      deadline: "2026-08-20",
      description: "Documents administratifs dans une enveloppe protegee.",
      declaredValueCents: "0",
    });

    expect(result.weightKg).toBe(2.5);
  });

  it("rejects parcel requests over the allowed weight", () => {
    expect(() =>
      parcelRequestSchema.parse({
        originCity: "Paris",
        originCountry: "France",
        destinationCity: "Dakar",
        destinationCountry: "Senegal",
        packageType: "Vetements",
        weightKg: 80,
        deadline: "2026-08-20",
        description: "Un colis trop lourd pour le produit actuel.",
      }),
    ).toThrow();
  });

  it("accepts a valid traveler profile", () => {
    expect(
      profileSchema.parse({
        fullName: "Awa Diop",
        phone: "+221770000000",
        city: "Dakar",
        country: "Senegal",
        address: "Plateau, Dakar",
        role: "traveler",
        preferredLanguage: "fr",
      }).role,
    ).toBe("traveler");
  });

  it("rejects internal roles in public profile updates", () => {
    expect(() =>
      profileSchema.parse({
        fullName: "Awa Diop",
        phone: "+221770000000",
        city: "Dakar",
        country: "Senegal",
        address: "Plateau, Dakar",
        role: "admin",
        preferredLanguage: "fr",
      }),
    ).toThrow();
  });

  it("accepts a KYC identity verification draft", () => {
    const result = identityVerificationSchema.parse({
      documentType: "passport",
      documentNumber: "A123456",
      issuingCountry: "Senegal",
      expiresOn: "2030-01-01",
      passportFilePath: "user-id/passport.pdf",
    });

    expect(result.documentType).toBe("passport");
  });

  it("accepts a valid trip", () => {
    const result = tripSchema.parse({
      originCity: "Lyon",
      originCountry: "France",
      destinationCity: "Abidjan",
      destinationCountry: "Cote d'Ivoire",
      departureDate: "2026-09-01",
      arrivalDate: "2026-09-02",
      availableWeightKg: "8",
      notes: "",
    });

    expect(result.availableWeightKg).toBe(8);
  });
});

describe("auth redirect safety", () => {
  it("keeps internal relative redirects", () => {
    expect(getSafeAuthRedirect("/dashboard?tab=trips")).toBe("/dashboard?tab=trips");
  });

  it("rejects external redirects", () => {
    expect(getSafeAuthRedirect("https://example.com")).toBe("/dashboard");
    expect(getSafeAuthRedirect("//example.com")).toBe("/dashboard");
  });

  it("rejects redirects with control characters or backslashes", () => {
    expect(getSafeAuthRedirect("/\\example.com")).toBe("/dashboard");
    expect(getSafeAuthRedirect("/dashboard\nSet-Cookie:x=y")).toBe("/dashboard");
  });
});
