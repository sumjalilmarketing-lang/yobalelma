import { z } from "zod";

export const createQrTokenSchema = z.object({
  batchId: z.string().trim().uuid("Batch invalide."),
  tokenType: z.enum(["origin_pickup", "destination_dropoff"]),
  expiresInMinutes: z.coerce.number().int().min(5).max(240).default(30),
});

export const scanQrTokenSchema = z.object({
  token: z.string().trim().min(32, "Token QR invalide.").max(256),
  expectedTokenType: z.enum(["origin_pickup", "destination_dropoff"]),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
  incidentType: z.string().trim().max(120).optional().or(z.literal("")),
});

export type CreateQrTokenInput = z.infer<typeof createQrTokenSchema>;
export type ScanQrTokenInput = z.infer<typeof scanQrTokenSchema>;
