import { z } from "zod";

const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");
const uuidSchema = z.string().trim().uuid("Identifiant invalide.");
const optionalUuidSchema = uuidSchema.optional().or(z.literal(""));
const optionalTextArraySchema = z.array(z.string().trim().min(1).max(500)).optional();

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
  confidenceScore: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().min(0).max(1).optional(),
  ),
  extractionPayload: z.record(z.string(), z.unknown()).optional(),
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
  tripId: z.string().trim().uuid("Trajet invalide.").optional().or(z.literal("")),
  travelerId: z.string().trim().uuid("Voyageur invalide.").optional().or(z.literal("")),
});

export const hubBatchAssignmentSchema = z.object({
  batchId: uuidSchema,
  shipmentId: uuidSchema,
  reservedWeightKg: z.coerce.number().positive("Poids invalide.").max(1000),
});

export const hubInspectionSchema = z.object({
  shipmentId: uuidSchema,
  batchId: optionalUuidSchema,
  decision: z.enum(["accepted", "damaged", "missing", "rejected"]),
  measuredWeightKg: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().positive("Poids invalide.").max(1000).optional(),
  ),
  storageLocation: z.string().trim().max(120).optional().or(z.literal("")),
  photoPath: z.string().trim().max(500).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const hubManifestItemSchema = z.object({
  shipmentId: optionalUuidSchema,
  trackingCode: z.string().trim().min(3, "Tracking requis.").max(80),
  status: z.enum([
    "expected_at_hub",
    "received_at_hub",
    "partially_received",
    "missing_at_hub",
    "damaged_at_hub",
    "extra_at_hub",
    "quarantined",
    "rejected_at_hub",
  ]),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  photoPaths: optionalTextArraySchema,
});

export const hubInboundReceiptSchema = z.object({
  hubId: uuidSchema,
  manifestId: optionalUuidSchema,
  collectionRouteId: optionalUuidSchema,
  collectionVehicleLabel: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z.array(hubManifestItemSchema).min(1, "Au moins un colis est requis.").max(500),
});

export const hubAdvancedInspectionSchema = z.object({
  hubId: uuidSchema,
  shipmentId: uuidSchema,
  declaredWeightKg: z.coerce.number().positive("Poids declare invalide.").max(1000).optional(),
  measuredWeightKg: z.coerce.number().positive("Poids mesure invalide.").max(1000),
  declaredDimensionsCm: z.record(z.string(), z.coerce.number().nonnegative()).optional(),
  measuredDimensionsCm: z.record(z.string(), z.coerce.number().nonnegative()).optional(),
  packageCondition: z.string().trim().min(2).max(120).default("conforme"),
  packagingCompliant: z.coerce.boolean().default(true),
  declaredContent: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(120).optional().or(z.literal("")),
  fragile: z.coerce.boolean().default(false),
  declaredValueCents: z.coerce.number().int().nonnegative().optional(),
  decision: z.enum([
    "approved",
    "needs_repackaging",
    "needs_customer_confirmation",
    "blocked",
    "rejected",
    "quarantined",
  ]),
  anomalyType: z.enum([
    "missing_package",
    "extra_package",
    "damaged_package",
    "wrong_weight",
    "wrong_dimensions",
    "prohibited_item",
    "packaging_issue",
    "wrong_destination",
    "traveler_cancelled",
    "flight_changed",
    "capacity_mismatch",
    "qr_issue",
    "storage_issue",
    "manifest_mismatch",
    "manual_review",
  ]).optional(),
  photoPaths: optionalTextArraySchema,
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const hubStorageMoveSchema = z.object({
  hubId: uuidSchema,
  shipmentId: uuidSchema,
  toLocationId: optionalUuidSchema,
  status: z.enum([
    "received",
    "inspection_required",
    "approved",
    "quarantined",
    "rejected",
    "in_storage",
    "reserved_for_batch",
    "picked_for_batch",
    "handed_over",
    "damaged",
    "missing",
  ]).default("in_storage"),
  measuredWeightKg: z.coerce.number().positive().max(1000).optional(),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const hubIncidentSchema = z.object({
  incidentType: z.enum([
    "missing_package",
    "extra_package",
    "damaged_package",
    "wrong_weight",
    "wrong_dimensions",
    "prohibited_item",
    "packaging_issue",
    "wrong_destination",
    "traveler_cancelled",
    "flight_changed",
    "capacity_mismatch",
    "qr_issue",
    "storage_issue",
    "manifest_mismatch",
    "manual_review",
  ]),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  hubId: optionalUuidSchema,
  shipmentId: optionalUuidSchema,
  batchId: optionalUuidSchema,
  priority: z.enum(["low", "medium", "high", "urgent", "critical"]).default("medium"),
  blocksPayout: z.coerce.boolean().default(false),
});

export const hubHandoverEventSchema = z.object({
  batchId: uuidSchema,
  tokenId: optionalUuidSchema,
  verifiedIdentity: z.coerce.boolean(),
  verifiedDocument: z.coerce.boolean(),
  verifiedTicket: z.coerce.boolean(),
  measuredWeightKg: z.coerce.number().positive().max(1000).optional(),
  signaturePath: z.string().trim().max(500).optional().or(z.literal("")),
  photoPaths: optionalTextArraySchema,
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type TravelDocumentInput = z.infer<typeof travelDocumentSchema>;
export type HubBatchInput = z.infer<typeof hubBatchSchema>;
export type HubBatchAssignmentInput = z.infer<typeof hubBatchAssignmentSchema>;
export type HubInspectionInput = z.infer<typeof hubInspectionSchema>;
export type HubInboundReceiptInput = z.infer<typeof hubInboundReceiptSchema>;
export type HubAdvancedInspectionInput = z.infer<typeof hubAdvancedInspectionSchema>;
export type HubStorageMoveInput = z.infer<typeof hubStorageMoveSchema>;
export type HubIncidentInput = z.infer<typeof hubIncidentSchema>;
export type HubHandoverEventInput = z.infer<typeof hubHandoverEventSchema>;
export type TravelDocumentFormInput = z.input<typeof travelDocumentSchema>;
export type HubBatchFormInput = z.input<typeof hubBatchSchema>;
export type HubBatchAssignmentFormInput = z.input<typeof hubBatchAssignmentSchema>;
export type HubInspectionFormInput = z.input<typeof hubInspectionSchema>;
