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
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
});

const serverEnvSchema = publicEnvSchema.extend({
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL."),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "Supabase service role key is required."),
});

type EnvSource = Record<string, string | undefined>;

export type PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
};

export type ServerEnv = PublicEnv & {
  NEXT_PUBLIC_APP_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

function getPublishableKey(source: EnvSource) {
  return (
    source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    source.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

function normalizePublicEnv(data: z.infer<typeof publicEnvSchema>): PublicEnv {
  const publishableKey = getPublishableKey(data);

  if (!publishableKey) {
    throw new Error("Supabase publishable key is required.");
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: data.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishableKey,
  };
}

export function validatePublicEnv(source: EnvSource): PublicEnv {
  const result = publicEnvSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid Yobalelma environment: ${details}`);
  }

  try {
    return normalizePublicEnv(result.data);
  } catch (error) {
    throw new Error(
      `Invalid Yobalelma environment: ${
        error instanceof Error ? error.message : "Supabase publishable key is required."
      }`,
    );
  }
}

export function getPublicEnv() {
  return validatePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function getOptionalPublicEnv() {
  try {
    return getPublicEnv();
  } catch {
    return null;
  }
}

export function validateServerEnv(source: EnvSource): ServerEnv {
  const result = serverEnvSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid Yobalelma server environment: ${details}`);
  }

  try {
    return {
      ...normalizePublicEnv(result.data),
      NEXT_PUBLIC_APP_URL: result.data.NEXT_PUBLIC_APP_URL,
      SUPABASE_SERVICE_ROLE_KEY: result.data.SUPABASE_SERVICE_ROLE_KEY,
    };
  } catch (error) {
    throw new Error(
      `Invalid Yobalelma server environment: ${
        error instanceof Error ? error.message : "Supabase publishable key is required."
      }`,
    );
  }
}

export function getServerEnv() {
  return validateServerEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}

export function getOptionalServerEnv() {
  try {
    return getServerEnv();
  } catch {
    return null;
  }
}
