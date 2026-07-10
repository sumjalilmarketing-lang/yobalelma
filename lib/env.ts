import { z } from "zod";

export const YOBALELMA_SUPABASE_URL =
  "https://rgcgtcycbiuhcaoaadbh.supabase.co" as const;

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url()
    .refine((value) => value === YOBALELMA_SUPABASE_URL, {
      message: "Supabase URL must be the Yobalelma project URL.",
    }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase anon key is required."),
});

type EnvSource = Record<string, string | undefined>;

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function validatePublicEnv(source: EnvSource): PublicEnv {
  const result = publicEnvSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid Yobalelma environment: ${details}`);
  }

  return result.data;
}

export function getPublicEnv() {
  return validatePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
