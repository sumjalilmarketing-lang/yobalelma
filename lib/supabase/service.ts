import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getOptionalServerEnv, getServerEnv } from "@/lib/env";
import type { Database } from "@/types/database.types";

export function createSupabaseServiceClient() {
  const env = getServerEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export function tryCreateSupabaseServiceClient() {
  const env = getOptionalServerEnv();

  if (!env) {
    return null;
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
