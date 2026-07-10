import { z } from "zod";
import { publicSignupRoles } from "@/lib/auth/roles";

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Nom trop court.").max(120),
  phone: z.string().trim().min(6, "Telephone trop court.").max(32),
  city: z.string().trim().min(2, "Ville trop courte.").max(80),
  country: z.string().trim().min(2, "Pays trop court.").max(80),
  address: z.string().trim().min(4, "Adresse trop courte.").max(240),
  role: z.enum(publicSignupRoles),
  preferredLanguage: z.enum(["fr", "en"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const identityVerificationSchema = z.object({
  documentType: z.enum(["national_id", "passport", "residence_permit", "driver_license"]),
  documentNumber: z.string().trim().min(4).max(80).optional().or(z.literal("")),
  issuingCountry: z.string().trim().min(2).max(80),
  expiresOn: z.string().trim().min(10).max(10),
  frontFilePath: z.string().trim().min(3).max(500).optional().or(z.literal("")),
  backFilePath: z.string().trim().min(3).max(500).optional().or(z.literal("")),
  selfieFilePath: z.string().trim().min(3).max(500).optional().or(z.literal("")),
  passportFilePath: z.string().trim().min(3).max(500).optional().or(z.literal("")),
});

export type IdentityVerificationInput = z.infer<typeof identityVerificationSchema>;
