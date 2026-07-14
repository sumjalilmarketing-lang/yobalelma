import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, type Page, test } from "playwright/test";

const EXPECTED_SUPABASE_URL = "https://rgcgtcycbiuhcaoaadbh.supabase.co";

export type E2ERole =
  | "admin"
  | "client"
  | "collection_driver"
  | "hub_agent"
  | "local_transporter"
  | "operations_manager"
  | "relay_agent"
  | "support_agent"
  | "traveler";

export type E2EUser = {
  email: string;
  id: string;
  password: string;
  role: E2ERole;
};

const DEFAULT_E2E_NAMESPACE = "default";
const userCache = new Map<string, Promise<E2EUser>>();

export function requireSupabaseAuthenticatedE2E() {
  test.skip(
    process.env.NEXT_PUBLIC_SUPABASE_URL !== EXPECTED_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
    "Variables Supabase Yobalelma requises pour les E2E authentifies.",
  );
}

export function ensureE2EUser(role: E2ERole, namespace = DEFAULT_E2E_NAMESPACE) {
  const normalizedNamespace = normalizeE2ENamespace(namespace);
  const cacheKey = `${normalizedNamespace}:${role}`;
  const cached = userCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const promise = createOrUpdateE2EUser(role, normalizedNamespace);
  userCache.set(cacheKey, promise);
  return promise;
}

export async function loginAs(page: Page, user: E2EUser, nextPath?: string) {
  const signInPath = nextPath
    ? `/auth/sign-in?next=${encodeURIComponent(nextPath)}`
    : "/auth/sign-in";
  await page.goto(signInPath);

  const passwordForm = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Se connecter" }) });
  await expect(passwordForm).toHaveCount(1);

  await passwordForm.getByLabel("Email").fill(user.email);
  await passwordForm.getByLabel("Mot de passe").fill(user.password);
  await Promise.all([
    page
      .waitForURL((url) => url.pathname !== "/auth/sign-in", { timeout: 15_000 })
      .catch(() => null),
    passwordForm.getByRole("button", { name: "Se connecter" }).click(),
  ]);
}

export function dateFromToday(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalizeE2ENamespace(namespace: string) {
  const normalized = namespace
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);

  return normalized || DEFAULT_E2E_NAMESPACE;
}

function e2eEmailForRole(role: E2ERole, namespace: string) {
  if (namespace === DEFAULT_E2E_NAMESPACE) {
    return `codex.${role}@yobalelma.test`;
  }

  return `codex.${namespace}.${role}@yobalelma.test`;
}

async function createOrUpdateE2EUser(
  role: E2ERole,
  namespace: string,
): Promise<E2EUser> {
  const supabase = createAdminClient();
  const email = e2eEmailForRole(role, namespace);
  const password = `Yb-${randomUUID()}-Test!2026`;
  const existing = await findUserByEmail(supabase, email);
  const metadata = {
    city: "Paris",
    country: "France",
    full_name: `Codex ${namespace} ${role} test`,
    phone: "+33100000000",
    primary_role: role,
    yobalelma_e2e: true,
  };

  const user = existing
    ? await updateAuthUser(supabase, existing.id, password, metadata)
    : await createAuthUser(supabase, email, password, metadata);

  await upsertProfile(supabase, {
    email,
    id: user.id,
    role,
  });

  return {
    email,
    id: user.id,
    password,
    role,
  };
}

export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl !== EXPECTED_SUPABASE_URL || !serviceRoleKey) {
    throw new Error("Supabase Yobalelma service credentials are required for authenticated E2E.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function findUserByEmail(supabase: SupabaseClient, email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);

    if (user) {
      return user;
    }

    if (data.users.length < 100) {
      return null;
    }
  }

  return null;
}

async function createAuthUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  metadata: Record<string, unknown>,
) {
  const { data, error } = await supabase.auth.admin.createUser({
    app_metadata: {
      yobalelma_e2e: true,
    },
    email,
    email_confirm: true,
    password,
    user_metadata: metadata,
  } as Parameters<typeof supabase.auth.admin.createUser>[0]);

  if (error || !data.user) {
    throw error ?? new Error("Supabase did not return a created test user.");
  }

  return data.user;
}

async function updateAuthUser(
  supabase: SupabaseClient,
  userId: string,
  password: string,
  metadata: Record<string, unknown>,
) {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: {
      yobalelma_e2e: true,
    },
    email_confirm: true,
    password,
    user_metadata: metadata,
  } as Parameters<typeof supabase.auth.admin.updateUserById>[1]);

  if (error || !data.user) {
    throw error ?? new Error("Supabase did not return an updated test user.");
  }

  return data.user;
}

async function upsertProfile(
  supabase: SupabaseClient,
  {
    email,
    id,
    role,
  }: {
    email: string;
    id: string;
    role: E2ERole;
  },
) {
  const { error: profileError } = await supabase.from("profiles").upsert({
    account_status: "active",
    address_line1: "1 rue des Tests",
    city: "Paris",
    country: "France",
    email,
    full_name: `Codex ${role} test`,
    id,
    is_verified: true,
    phone: "+33100000000",
    preferred_language: "fr",
    primary_role: role,
    role,
  });

  if (profileError) {
    throw profileError;
  }

  const { error: roleError } = await supabase.from("user_roles").upsert({
    profile_id: id,
    role_id: role,
  });

  if (roleError) {
    throw roleError;
  }
}
