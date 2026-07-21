import { z } from "zod";

export const paymentIntentSchema = z.object({
  shipmentId: z.string().trim().uuid("Expedition invalide."),
}).strict();

export const supportTicketSchema = z.object({
  shipmentId: z.string().trim().uuid("Expedition invalide.").optional().or(z.literal("")),
  category: z.enum(["shipment", "payment", "kyc", "damage", "delay", "other"]),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  subject: z.string().trim().min(4, "Sujet trop court.").max(160),
  message: z.string().trim().min(10, "Message trop court.").max(2000),
});

export const supportMessageSchema = z.object({
  ticketId: z.string().trim().uuid("Ticket invalide."),
  message: z.string().trim().min(2, "Message trop court.").max(2000),
});

export const notificationCreateSchema = z.object({
  recipientId: z.string().trim().uuid("Destinataire invalide."),
  shipmentId: z.string().trim().uuid("Expedition invalide.").optional().or(z.literal("")),
  type: z.enum([
    "shipment_update",
    "payment_update",
    "mission_update",
    "kyc_update",
    "support_update",
    "security_alert",
  ]),
  channel: z.enum(["in_app", "email", "sms", "whatsapp"]).default("in_app"),
  title: z.string().trim().min(3, "Titre trop court.").max(160),
  body: z.string().trim().min(3, "Message trop court.").max(2000),
  actionUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

export const notificationReadSchema = z.object({
  notificationId: z.string().trim().uuid("Notification invalide."),
});

export const shipmentDisputeSchema = z.object({
  shipmentId: z.string().trim().uuid("Expedition invalide."),
  category: z.enum([
    "lost_package",
    "damaged_package",
    "late_delivery",
    "payment_issue",
    "kyc_issue",
    "other",
  ]),
  subject: z.string().trim().min(4, "Sujet trop court.").max(180),
  description: z.string().trim().min(10, "Description trop courte.").max(4000),
  evidenceBucket: z.string().trim().max(120).optional().or(z.literal("")),
  evidencePath: z.string().trim().max(500).optional().or(z.literal("")),
});

export const deliveryProofSchema = z.object({
  shipmentId: z.string().trim().uuid("Expedition invalide."),
  missionId: z.string().trim().uuid("Mission invalide.").optional().or(z.literal("")),
  handoverQrTokenId: z.string().trim().uuid("QR invalide.").optional().or(z.literal("")),
  proofType: z.enum(["photo", "signature", "otp", "qr_scan", "document"]),
  storageBucket: z.string().trim().max(120).optional().or(z.literal("")),
  storagePath: z.string().trim().max(500).optional().or(z.literal("")),
  otpConfirmed: z.boolean().default(false),
  recipientName: z.string().trim().max(160).optional().or(z.literal("")),
  recipientPhoneLast4: z
    .string()
    .trim()
    .regex(/^[0-9]{4}$/, "Les 4 derniers chiffres sont requis.")
    .optional()
    .or(z.literal("")),
});

export const commissionSchema = z.object({
  shipmentId: z.string().trim().uuid("Expedition invalide."),
  paymentIntentId: z.string().trim().uuid("Paiement invalide."),
  grossAmountCents: z.coerce.number().int().positive("Montant invalide.").max(100_000_000),
  currency: z.enum(["EUR", "XOF", "USD"]).default("EUR"),
  commissionRateBps: z.coerce.number().int().min(0).max(10_000).default(1500),
  beneficiaryId: z.string().trim().uuid("Beneficiaire invalide.").optional().or(z.literal("")),
});

export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
export type SupportMessageInput = z.infer<typeof supportMessageSchema>;
export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>;
export type NotificationReadInput = z.infer<typeof notificationReadSchema>;
export type ShipmentDisputeInput = z.infer<typeof shipmentDisputeSchema>;
export type DeliveryProofInput = z.infer<typeof deliveryProofSchema>;
export type CommissionInput = z.infer<typeof commissionSchema>;
export type PaymentIntentFormInput = z.input<typeof paymentIntentSchema>;
export type SupportTicketFormInput = z.input<typeof supportTicketSchema>;
export type SupportMessageFormInput = z.input<typeof supportMessageSchema>;
export type NotificationCreateFormInput = z.input<typeof notificationCreateSchema>;
export type ShipmentDisputeFormInput = z.input<typeof shipmentDisputeSchema>;
export type DeliveryProofFormInput = z.input<typeof deliveryProofSchema>;
export type CommissionFormInput = z.input<typeof commissionSchema>;
