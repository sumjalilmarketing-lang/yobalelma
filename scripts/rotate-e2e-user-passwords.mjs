import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const EXPECTED_SUPABASE_URL = "https://rgcgtcycbiuhcaoaadbh.supabase.co";
const workspaceRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { loadEnvConfig } = nextEnv;

loadEnvConfig(workspaceRoot);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl !== EXPECTED_SUPABASE_URL || !serviceRoleKey) {
  throw new Error("La configuration d’administration Yobalelma est requise.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

let page = 1;
let rotated = 0;

while (true) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page,
    perPage: 1000,
  });

  if (error) {
    throw error;
  }

  const testUsers = data.users.filter((user) =>
    /^codex\.[a-z0-9.-]+@yobalelma\.test$/i.test(user.email ?? ""),
  );

  for (const user of testUsers) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: `Yb-${randomBytes(24).toString("base64url")}!aA1` },
    );

    if (updateError) {
      throw updateError;
    }

    rotated += 1;
  }

  if (data.users.length < 1000) {
    break;
  }

  page += 1;
}

console.log(`Comptes E2E sécurisés : ${rotated}`);
