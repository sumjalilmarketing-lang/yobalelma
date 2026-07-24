import { z } from "zod";

const optionalEmailSchema = z
  .string()
  .trim()
  .email("Email invalide.")
  .max(254)
  .optional()
  .or(z.literal(""));

const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");

export const shipmentSchema = z
  .object({
    senderName: z.string().trim().min(2, "Nom expediteur requis.").max(120),
    senderPhone: z.string().trim().min(6, "Telephone expediteur requis.").max(32),
    senderEmail: optionalEmailSchema,
    pickupAddressLine1: z.string().trim().min(4, "Adresse de depart requise.").max(240),
    pickupAddressLine2: z.string().trim().max(240).optional().or(z.literal("")),
    pickupCity: z.string().trim().min(2, "Ville de depart requise.").max(80),
    pickupPostalCode: z.string().trim().max(20).optional().or(z.literal("")),
    pickupCountry: z.string().trim().min(2, "Pays de depart requis.").max(80),
    pickupInstructions: z.string().trim().max(500).optional().or(z.literal("")),
    pickupFormattedAddress: z.string().trim().max(500).optional().or(z.literal("")),
    pickupLandmark: z.string().trim().max(240).optional().or(z.literal("")),
    pickupNeighborhood: z.string().trim().max(160).optional().or(z.literal("")),
    pickupCommune: z.string().trim().max(160).optional().or(z.literal("")),
    pickupRegion: z.string().trim().max(160).optional().or(z.literal("")),
    pickupCountryCode: z.string().trim().max(2).optional().or(z.literal("")),
    pickupLatitude: z.coerce.number().min(-90).max(90).optional(), pickupLongitude: z.coerce.number().min(-180).max(180).optional(),
    pickupProviderPlaceId: z.string().trim().max(500).optional().or(z.literal("")), pickupLocationType: z.string().trim().max(40).optional().or(z.literal("")), pickupGeocodingProvider: z.string().trim().max(80).optional().or(z.literal("")), pickupAccuracyLevel: z.string().trim().max(40).optional().or(z.literal("")), pickupValidationStatus: z.string().trim().max(40).optional().or(z.literal("")), pickupPlusCode: z.string().trim().max(32).optional().or(z.literal("")),
    recipientName: z.string().trim().min(2, "Nom destinataire requis.").max(120),
    recipientPhone: z.string().trim().min(6, "Telephone destinataire requis.").max(32),
    recipientEmail: optionalEmailSchema,
    deliveryAddressLine1: z.string().trim().min(4, "Adresse d'arrivee requise.").max(240),
    deliveryAddressLine2: z.string().trim().max(240).optional().or(z.literal("")),
    deliveryCity: z.string().trim().min(2, "Ville d'arrivee requise.").max(80),
    deliveryPostalCode: z.string().trim().max(20).optional().or(z.literal("")),
    deliveryCountry: z.string().trim().min(2, "Pays d'arrivee requis.").max(80),
    deliveryInstructions: z.string().trim().max(500).optional().or(z.literal("")),
    deliveryFormattedAddress: z.string().trim().max(500).optional().or(z.literal("")), deliveryLandmark: z.string().trim().max(240).optional().or(z.literal("")), deliveryNeighborhood: z.string().trim().max(160).optional().or(z.literal("")), deliveryCommune: z.string().trim().max(160).optional().or(z.literal("")), deliveryRegion: z.string().trim().max(160).optional().or(z.literal("")), deliveryCountryCode: z.string().trim().max(2).optional().or(z.literal("")),
    deliveryLatitude: z.coerce.number().min(-90).max(90).optional(), deliveryLongitude: z.coerce.number().min(-180).max(180).optional(), deliveryProviderPlaceId: z.string().trim().max(500).optional().or(z.literal("")), deliveryLocationType: z.string().trim().max(40).optional().or(z.literal("")), deliveryGeocodingProvider: z.string().trim().max(80).optional().or(z.literal("")), deliveryAccuracyLevel: z.string().trim().max(40).optional().or(z.literal("")), deliveryValidationStatus: z.string().trim().max(40).optional().or(z.literal("")), deliveryPlusCode: z.string().trim().max(32).optional().or(z.literal("")),
    packageTitle: z.string().trim().min(2, "Nom du colis requis.").max(120),
    packageCategory: z.enum([
      "documents",
      "clothing",
      "electronics",
      "food_dry",
      "cosmetics",
      "other",
    ]),
    packageDescription: z.string().trim().min(10, "Description trop courte.").max(800),
    weightKg: z.coerce.number().positive("Poids invalide.").max(50, "Poids maximum 50 kg."),
    lengthCm: z.coerce.number().positive("Longueur invalide.").max(200),
    widthCm: z.coerce.number().positive("Largeur invalide.").max(200),
    heightCm: z.coerce.number().positive("Hauteur invalide.").max(200),
    declaredValueCents: z.coerce.number().int().min(0).max(10_000_000).default(0),
    fragile: z.coerce.boolean().default(false),
    serviceLevel: z.enum(["standard", "express"]).default("standard"),
    fulfillmentMethod: z.enum(["pickup", "relay_dropoff"]).default("pickup"),
    packagePhotoPath: z.string().trim().max(500).optional().or(z.literal("")),
    preferredPickupDate: dateSchema,
    latestDeliveryDate: dateSchema,
    prohibitedItemsConfirmed: z
      .boolean()
      .refine((value) => value, "Confirme que le colis ne contient pas d'objet interdit."),
    confirmationAccepted: z
      .boolean()
      .refine((value) => value, "Confirme les informations avant creation."),
  })
  .refine(
    (value) => new Date(value.latestDeliveryDate) >= new Date(value.preferredPickupDate),
    {
      message: "La date limite doit etre apres la date d'enlevement.",
      path: ["latestDeliveryDate"],
    },
  );

export type ShipmentInput = z.infer<typeof shipmentSchema>;
export type ShipmentFormInput = z.input<typeof shipmentSchema>;
