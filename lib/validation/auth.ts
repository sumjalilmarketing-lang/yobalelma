import { z } from "zod";
import { publicSignupRoles } from "@/lib/auth/roles";

export const emailAuthSchema = z.object({
  email: z.string().trim().email("Adresse email invalide.").max(254),
});

export type EmailAuthInput = z.infer<typeof emailAuthSchema>;

export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caracteres.")
  .max(128)
  .regex(/[A-Z]/, "Ajoute au moins une majuscule.")
  .regex(/[a-z]/, "Ajoute au moins une minuscule.")
  .regex(/[0-9]/, "Ajoute au moins un chiffre.");

export const signInSchema = z.object({
  email: z.string().trim().email("Adresse email invalide.").max(254),
  password: z.string().min(1, "Mot de passe requis."),
});

export const signUpSchema = z
  .object({
    email: z.string().trim().email("Adresse email invalide.").max(254),
    password: passwordSchema,
    confirmPassword: z.string(),
    fullName: z.string().trim().min(2, "Nom trop court.").max(120),
    phone: z.string().trim().min(6, "Telephone trop court.").max(32),
    country: z.string().trim().min(2, "Pays requis.").max(80),
    city: z.string().trim().min(2, "Ville requise.").max(80),
    address: z.string().trim().min(4, "Adresse requise.").max(240),
    role: z.enum(publicSignupRoles),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Adresse email invalide.").max(254),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
