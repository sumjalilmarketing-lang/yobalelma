import { z } from "zod";

export const finalDeliveryModes = ["relay_pickup", "home_delivery"] as const;

export const finalDeliveryAttemptStatuses = [
  "delivery_attempted",
  "recipient_absent",
  "invalid_address",
  "delivery_rescheduled",
  "returned_to_relay",
  "refused_by_recipient",
  "delivery_blocked",
  "return_requested",
] as const;

export const finalDeliveryAdminStatuses = [
  "destination_batch_received",
  "destination_package_confirmed",
  "destination_package_missing",
  "destination_package_damaged",
  "stored_at_destination_relay",
  "awaiting_recipient_choice",
  "awaiting_recipient_pickup",
  "awaiting_final_delivery",
  "ready_for_recipient",
  "delivery_assigned",
  "out_for_delivery",
  "delivery_attempted",
  "recipient_absent",
  "invalid_address",
  "otp_failed",
  "delivery_rescheduled",
  "returned_to_relay",
  "refused_by_recipient",
  "delivery_blocked",
  "return_requested",
  "delivered",
  "disputed",
] as const;

const optionalText = (max = 1000) =>
  z.string().trim().max(max).optional().or(z.literal(""));

export const destinationBatchReceptionSchema = z.object({
  batchId: z.string().trim().uuid("Lot invalide."),
  relayPointId: z.string().trim().uuid("Point relais invalide.").optional().or(z.literal("")),
  note: optionalText(),
  defaultDeliveryMode: z.enum(finalDeliveryModes).default("relay_pickup"),
});

export const finalDeliveryChoiceSchema = z.object({
  shipmentId: z.string().trim().uuid("Expedition invalide."),
  deliveryMode: z.enum(finalDeliveryModes),
  reason: optionalText(600),
});

export const deliveryOtpGenerateSchema = z.object({
  shipmentId: z.string().trim().uuid("Expedition invalide."),
  deliveryMode: z.enum(finalDeliveryModes),
  ttlMinutes: z.coerce.number().int().min(5).max(60).default(15),
  channel: z.enum(["in_app", "email", "sms", "whatsapp"]).default("in_app"),
});

export const deliveryOtpVerifySchema = z.object({
  shipmentId: z.string().trim().uuid("Expedition invalide."),
  deliveryMode: z.enum(finalDeliveryModes),
  otpCode: z.string().trim().regex(/^[0-9]{6}$/, "OTP invalide."),
  missionId: z.string().trim().uuid("Mission invalide.").optional().or(z.literal("")),
  recipientName: optionalText(120),
  recipientPhoneLast4: z.string().trim().regex(/^[0-9]{4}$/).optional().or(z.literal("")),
  signaturePath: optionalText(500),
  photoPath: optionalText(500),
  note: optionalText(1000),
});

export const deliveryOtpRevokeSchema = z.object({
  otpId: z.string().trim().uuid("OTP invalide."),
  reason: z.string().trim().min(8, "Motif requis.").max(800),
});

export const finalMileMissionSchema = z.object({
  shipmentId: z.string().trim().uuid("Expedition invalide."),
  transporterId: z.string().trim().uuid("Livreur invalide.").optional().or(z.literal("")),
  note: optionalText(800),
});

export const finalDeliveryAttemptSchema = z.object({
  shipmentId: z.string().trim().uuid("Expedition invalide."),
  status: z.enum(finalDeliveryAttemptStatuses),
  note: z.string().trim().min(6, "Note obligatoire.").max(1000),
  rescheduledFor: z.string().trim().datetime().optional().or(z.literal("")),
});

export const manualCorrectionSchema = z.object({
  entityType: z.string().trim().min(3).max(120),
  entityId: z.string().trim().uuid("Entite invalide."),
  action: z.string().trim().min(3).max(160),
  permissionKey: z.string().trim().min(3).max(160),
  oldValue: z.record(z.string(), z.unknown()).default({}),
  newValue: z.record(z.string(), z.unknown()).default({}),
  reason: z.string().trim().min(8, "Motif obligatoire.").max(1000),
  comment: z.string().trim().min(8, "Commentaire obligatoire.").max(2000),
  requiresSecondApproval: z.coerce.boolean().default(false),
});

export const deliveryOverrideSchema = z.object({
  shipmentId: z.string().trim().uuid("Expedition invalide."),
  newStatus: z.enum(finalDeliveryAdminStatuses),
  reason: z.string().trim().min(8, "Motif obligatoire.").max(1000),
  comment: z.string().trim().min(8, "Commentaire obligatoire.").max(2000),
  forceDelivered: z.coerce.boolean().default(false),
});

export type FinalDeliveryMode = (typeof finalDeliveryModes)[number];
export type FinalDeliveryAttemptStatus = (typeof finalDeliveryAttemptStatuses)[number];
export type FinalDeliveryAdminStatus = (typeof finalDeliveryAdminStatuses)[number];
