import { z } from "zod";

export const relayPointSchema = z.object({
  name: z.string().trim().min(2, "Nom du relais requis.").max(120),
  contactName: z.string().trim().min(2, "Contact requis.").max(120),
  contactPhone: z.string().trim().min(6, "Telephone requis.").max(32),
  addressLine1: z.string().trim().min(4, "Adresse requise.").max(240),
  city: z.string().trim().min(2, "Ville requise.").max(80),
  country: z.string().trim().min(2, "Pays requis.").max(80),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  capacitySlots: z.coerce.number().int().positive("Capacite invalide.").max(10000),
});

export const relayScanSchema = z.object({
  trackingCode: z
    .string()
    .trim()
    .regex(/^YBL-[A-Z0-9]{8}$/, "Code de suivi invalide."),
  relayPointId: z.string().trim().uuid("Relais invalide."),
  scanType: z.enum(["check_in", "check_out", "handover", "exception"]),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type RelayPointInput = z.infer<typeof relayPointSchema>;
export type RelayScanInput = z.infer<typeof relayScanSchema>;
export type RelayPointFormInput = z.input<typeof relayPointSchema>;
export type RelayScanFormInput = z.input<typeof relayScanSchema>;
