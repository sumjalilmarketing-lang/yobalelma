import { expect, type APIRequestContext, test } from "playwright/test";

export const hasSupabaseE2EEnv =
  process.env.NEXT_PUBLIC_SUPABASE_URL === "https://rgcgtcycbiuhcaoaadbh.supabase.co" &&
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

export function requireSupabaseE2E() {
  test.skip(!hasSupabaseE2EEnv, "Variables Supabase Yobalelma requises pour ce parcours E2E reel.");
}

export async function expectLandingReady(request: APIRequestContext) {
  const response = await request.get("/");

  expect(response.status()).toBeLessThan(400);
}

export async function expectProtectedOrReady(request: APIRequestContext, path: string) {
  const response = await request.get(path);

  expect(response.status()).toBeLessThan(400);
}

export async function postJson(request: APIRequestContext, path: string, payload: unknown) {
  return request.post(path, {
    data: payload,
    headers: { "Content-Type": "application/json" },
  });
}
