import { z } from "zod";

export const yobalelmaIntentSchema = z.object({
  intent: z.enum(["send_parcel", "become_courier", "travel_with_yobalelma"]),
  origin: z.string().trim().min(2).max(80).optional().or(z.literal("")),
  destination: z.string().trim().min(2).max(80).optional().or(z.literal("")),
});

export type YobalelmaIntentInput = z.infer<typeof yobalelmaIntentSchema>;

