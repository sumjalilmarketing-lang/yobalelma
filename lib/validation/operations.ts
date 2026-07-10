import { z } from "zod";

export const paymentIntentSchema = z.object({
  shipmentId: z.string().trim().uuid("Expedition invalide."),
  amountCents: z.coerce.number().int().positive("Montant invalide.").max(10_000_000),
  currency: z.enum(["EUR", "XOF", "USD"]).default("EUR"),
});

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

export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
export type SupportMessageInput = z.infer<typeof supportMessageSchema>;
export type PaymentIntentFormInput = z.input<typeof paymentIntentSchema>;
export type SupportTicketFormInput = z.input<typeof supportTicketSchema>;
export type SupportMessageFormInput = z.input<typeof supportMessageSchema>;
