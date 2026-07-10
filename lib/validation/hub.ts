import { z } from "zod";

const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");

export const travelDocumentSchema = z.object({
  tripId: z.string().trim().uuid("Trajet invalide."),
  documentNumber: z.string().trim().min(4, "Numero requis.").max(80),
  issuingCountry: z.string().trim().min(2, "Pays requis.").max(80),
  travelerName: z.string().trim().min(2, "Nom voyageur requis.").max(120),
  departureAirport: z.string().trim().min(3, "Aeroport depart requis.").max(12),
  arrivalAirport: z.string().trim().min(3, "Aeroport arrivee requis.").max(12),
  departureDate: dateSchema,
  arrivalDate: dateSchema,
  filePath: z.string().trim().min(3, "Chemin fichier requis.").max(500),
});

export const hubBatchSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^HUB-[A-Z0-9]{6,12}$/, "Code batch invalide."),
  originHub: z.string().trim().min(2, "Hub depart requis.").max(120),
  destinationHub: z.string().trim().min(2, "Hub destination requis.").max(120),
  flightNumber: z.string().trim().max(30).optional().or(z.literal("")),
  departureDate: dateSchema,
  capacityKg: z.coerce.number().positive("Capacite invalide.").max(1000),
});

export const hubBatchAssignmentSchema = z.object({
  batchId: z.string().trim().uuid("Batch invalide."),
  shipmentId: z.string().trim().uuid("Expedition invalide."),
  reservedWeightKg: z.coerce.number().positive("Poids invalide.").max(1000),
});

export type TravelDocumentInput = z.infer<typeof travelDocumentSchema>;
export type HubBatchInput = z.infer<typeof hubBatchSchema>;
export type HubBatchAssignmentInput = z.infer<typeof hubBatchAssignmentSchema>;
export type TravelDocumentFormInput = z.input<typeof travelDocumentSchema>;
export type HubBatchFormInput = z.input<typeof hubBatchSchema>;
export type HubBatchAssignmentFormInput = z.input<typeof hubBatchAssignmentSchema>;
