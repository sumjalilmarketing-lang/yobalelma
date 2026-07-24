import { z } from "zod";

export const countryExperienceSchema = z.object({
  countryCode: z.string().regex(/^[A-Z]{2}$/u),
  version: z.number().int().positive(),
  defaultLocale: z.string().min(2).max(16),
  availableLocales: z.array(z.string().min(2).max(16)).min(1),
  currencyCode: z.string().regex(/^[A-Z]{3}$/u),
  timeZone: z.string().min(3).max(80),
  unitSystem: z.enum(["metric", "imperial"]),
});

export const countryExperienceDraftSchema = countryExperienceSchema.omit({ version: true });

export const advertiserDraftSchema = z.object({
  legalName: z.string().min(2).max(160),
  displayName: z.string().min(2).max(90),
  billingCountry: z.string().regex(/^[A-Z]{2}$/u),
  allowedDomains: z.array(z.string().min(3).max(253).regex(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/u)).max(20),
});

const httpsUrl = z.string().url().refine((value) => new URL(value).protocol === "https:", "Une adresse HTTPS est requise.");
const forbiddenMarkup = /<\/?(?:script|iframe|object|embed|style)|javascript:|on\w+\s*=/iu;

export const controlledCreativeSchema = z.object({
  campaignId: z.string().uuid(),
  placementId: z.string().uuid(),
  headline: z.string().min(2).max(90).refine((value) => !forbiddenMarkup.test(value)),
  body: z.string().min(2).max(240).refine((value) => !forbiddenMarkup.test(value)),
  ctaLabel: z.string().min(2).max(40).refine((value) => !forbiddenMarkup.test(value)),
  destinationUrl: httpsUrl,
  imageUrl: httpsUrl.optional(),
  altText: z.string().max(180).optional(),
});

export const adTargetingSchema = z.object({
  countries: z.array(z.string().regex(/^[A-Z]{2}$/u)).max(40),
  regions: z.array(z.string().max(48)).max(100),
  cities: z.array(z.string().max(80)).max(100),
  locales: z.array(z.string().max(16)).max(20),
  userTypes: z.array(z.enum(["client", "traveler", "local_transporter"])).max(3),
  shipmentTypes: z.array(z.string().max(48)).max(30),
  corridors: z.array(z.string().max(80)).max(100),
  devices: z.array(z.enum(["mobile", "tablet", "desktop"])).max(3),
  partners: z.array(z.string().max(80)).max(100),
}).strict();

export const allowedAdSurfaces = ["user_app", "website", "mobile_app"] as const;
