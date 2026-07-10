import { z } from "zod";

const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");
const timeSchema = z.string().trim().regex(/^\d{2}:\d{2}$/, "Heure invalide.");

export const transporterProfileSchema = z.object({
  businessName: z.string().trim().min(2, "Nom public requis.").max(120),
  bio: z.string().trim().min(10, "Description trop courte.").max(600),
  baseCity: z.string().trim().min(2, "Ville requise.").max(80),
  baseCountry: z.string().trim().min(2, "Pays requis.").max(80),
  maxWeightKg: z.coerce.number().positive("Capacite invalide.").max(200),
});

export const transporterVehicleSchema = z.object({
  type: z.enum(["bike", "scooter", "car", "van", "truck"]),
  label: z.string().trim().min(2, "Nom du vehicule requis.").max(120),
  plateNumber: z.string().trim().max(40).optional().or(z.literal("")),
  capacityKg: z.coerce.number().positive("Capacite invalide.").max(1000),
});

export const transporterZoneSchema = z.object({
  city: z.string().trim().min(2, "Ville requise.").max(80),
  country: z.string().trim().min(2, "Pays requis.").max(80),
  radiusKm: z.coerce.number().positive("Rayon invalide.").max(300),
});

export const transporterAvailabilitySchema = z
  .object({
    availableOn: dateSchema,
    startsAt: timeSchema,
    endsAt: timeSchema,
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: "L'heure de fin doit etre apres l'heure de debut.",
    path: ["endsAt"],
  });

export type TransporterProfileInput = z.infer<typeof transporterProfileSchema>;
export type TransporterVehicleInput = z.infer<typeof transporterVehicleSchema>;
export type TransporterZoneInput = z.infer<typeof transporterZoneSchema>;
export type TransporterAvailabilityInput = z.infer<typeof transporterAvailabilitySchema>;

export type TransporterProfileFormInput = z.input<typeof transporterProfileSchema>;
export type TransporterVehicleFormInput = z.input<typeof transporterVehicleSchema>;
export type TransporterZoneFormInput = z.input<typeof transporterZoneSchema>;
export type TransporterAvailabilityFormInput = z.input<
  typeof transporterAvailabilitySchema
>;
