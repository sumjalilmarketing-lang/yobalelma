import { NextResponse } from "next/server";
import { getOptionalPublicEnv } from "@/lib/env";

export async function GET() {
  const supabase = await checkSupabase();
  const healthy = supabase === "ok";

  return NextResponse.json(
    { status: healthy ? "ok" : "degraded" },
    { headers: { "Cache-Control": "no-store" }, status: healthy ? 200 : 503 },
  );
}

async function checkSupabase() {
  const env = getOptionalPublicEnv();

  if (!env) return "not_configured";

  try {
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      cache: "no-store",
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
      signal: AbortSignal.timeout(3_000),
    });

    return response.ok ? "ok" : "unavailable";
  } catch {
    return "unavailable";
  }
}
