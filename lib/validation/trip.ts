import { z } from "zod";

export const tripSchema = z.object({
  originCity: z.string().trim().min(2, "Ville de depart requise.").max(80),
  originCountry: z.string().trim().min(2, "Pays de depart requis.").max(80),
  destinationCity: z.string().trim().min(2, "Ville d'arrivee requise.").max(80),
  destinationCountry: z.string().trim().min(2, "Pays d'arrivee requis.").max(80),
  departureDate: z.string().trim().min(10, "Date de depart requise.").max(10),
  arrivalDate: z.string().trim().min(10, "Date d'arrivee requise.").max(10),
  availableWeightKg: z.coerce
    .number()
    .positive("Capacite invalide.")
    .max(80, "Capacite maximum 80 kg."),
  notes: z.string().trim().max(600).optional().or(z.literal("")),
});

export type TripInput = z.infer<typeof tripSchema>;
export type TripFormInput = z.input<typeof tripSchema>;
