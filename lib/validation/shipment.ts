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
    recipientName: z.string().trim().min(2, "Nom destinataire requis.").max(120),
    recipientPhone: z.string().trim().min(6, "Telephone destinataire requis.").max(32),
    recipientEmail: optionalEmailSchema,
    deliveryAddressLine1: z.string().trim().min(4, "Adresse d'arrivee requise.").max(240),
    deliveryAddressLine2: z.string().trim().max(240).optional().or(z.literal("")),
    deliveryCity: z.string().trim().min(2, "Ville d'arrivee requise.").max(80),
    deliveryPostalCode: z.string().trim().max(20).optional().or(z.literal("")),
    deliveryCountry: z.string().trim().min(2, "Pays d'arrivee requis.").max(80),
    deliveryInstructions: z.string().trim().max(500).optional().or(z.literal("")),
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
