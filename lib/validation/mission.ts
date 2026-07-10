import { z } from "zod";

export const dispatchMissionSchema = z.object({
  shipmentId: z.string().trim().uuid("Expedition invalide."),
  candidateLimit: z.coerce.number().int().min(1).max(10).default(3),
});

export const missionActionSchema = z.object({
  action: z.enum(["accept", "arrive", "pickup", "deliver"]),
  deliveryOtp: z.string().trim().regex(/^[0-9]{6}$/, "Code OTP invalide.").optional().or(z.literal("")),
  proofPath: z.string().trim().max(500).optional().or(z.literal("")),
});

export type DispatchMissionInput = z.infer<typeof dispatchMissionSchema>;
export type MissionActionInput = z.infer<typeof missionActionSchema>;
