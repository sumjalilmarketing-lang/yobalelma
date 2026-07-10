import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Nom trop court.").max(120),
  phone: z.string().trim().min(6, "Telephone trop court.").max(32),
  city: z.string().trim().min(2, "Ville trop courte.").max(80),
  country: z.string().trim().min(2, "Pays trop court.").max(80),
  role: z.enum(["sender", "traveler", "both"]),
  preferredLanguage: z.enum(["fr", "en"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;
