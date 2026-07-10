import { z } from "zod";

export const emailAuthSchema = z.object({
  email: z.string().trim().email("Adresse email invalide.").max(254),
});

export type EmailAuthInput = z.infer<typeof emailAuthSchema>;
