import { z } from "zod";

export const parcelRequestSchema = z.object({
  originCity: z.string().trim().min(2, "Ville de depart requise.").max(80),
  originCountry: z.string().trim().min(2, "Pays de depart requis.").max(80),
  destinationCity: z.string().trim().min(2, "Ville d'arrivee requise.").max(80),
  destinationCountry: z.string().trim().min(2, "Pays d'arrivee requis.").max(80),
  packageType: z.string().trim().min(2, "Type de colis requis.").max(80),
  weightKg: z.coerce.number().positive("Poids invalide.").max(50, "Poids maximum 50 kg."),
  deadline: z.string().trim().min(10, "Date limite requise.").max(10),
  description: z.string().trim().min(10, "Description trop courte.").max(600),
  declaredValueCents: z.coerce.number().int().min(0).max(10_000_000).default(0),
});

export type ParcelRequestInput = z.infer<typeof parcelRequestSchema>;
export type ParcelRequestFormInput = z.input<typeof parcelRequestSchema>;
