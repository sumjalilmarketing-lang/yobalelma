import { NextResponse } from "next/server";
import { getHubSnapshot } from "@hub-app/src/lib/hub-store";
import { getOptionalPublicEnv } from "@/lib/env";

export async function GET() {
  const snapshot = getHubSnapshot();
  const supabase = await checkSupabase();
  const healthy = supabase === "ok";

  return NextResponse.json({
    app: "hub-app",
    checks: {
      operationsStore: true,
      routes: 27,
      supabase,
      totalWeightInHubKg: snapshot.totalWeightInHubKg,
    },
    status: healthy ? "ok" : "degraded",
  }, { status: healthy ? 200 : 503 });
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
