import { getOptionalPublicEnv } from "@/lib/env";

export async function GET() {
  const env = getOptionalPublicEnv();
  let healthy = false;

  if (env) {
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
        cache: "no-store",
        headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
        signal: AbortSignal.timeout(3_000),
      });
      healthy = response.ok;
    } catch {
      healthy = false;
    }
  }

  return Response.json(
    { status: healthy ? "ok" : "degraded" },
    { headers: { "Cache-Control": "no-store" }, status: healthy ? 200 : 503 },
  );
}
