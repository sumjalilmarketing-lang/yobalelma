import { z } from "zod";

const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");

export const collectionRouteSchema = z.object({
  name: z.string().trim().min(2, "Nom de tournee requis.").max(120),
  routeDate: dateSchema,
  driverId: z.string().trim().uuid("Chauffeur invalide.").optional().or(z.literal("")),
});

export const collectionStopSchema = z.object({
  routeId: z.string().trim().uuid("Tournee invalide."),
  relayPointId: z.string().trim().uuid("Relais invalide."),
  stopOrder: z.coerce.number().int().positive("Ordre invalide.").max(500),
});

export const collectionManifestSchema = z.object({
  routeId: z.string().trim().uuid("Tournee invalide."),
  code: z
    .string()
    .trim()
    .regex(/^MAN-[A-Z0-9]{6,12}$/, "Code manifeste invalide."),
});

export const collectionManifestItemSchema = z.object({
  manifestId: z.string().trim().uuid("Manifeste invalide."),
  shipmentId: z.string().trim().uuid("Expedition invalide."),
  incidentNote: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CollectionRouteInput = z.infer<typeof collectionRouteSchema>;
export type CollectionStopInput = z.infer<typeof collectionStopSchema>;
export type CollectionManifestInput = z.infer<typeof collectionManifestSchema>;
export type CollectionManifestItemInput = z.infer<typeof collectionManifestItemSchema>;
