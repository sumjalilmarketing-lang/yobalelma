import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let healthy = false;

  if (url && key) {
    try {
      const response = await fetch(`${url}/auth/v1/health`, {
        cache: "no-store",
        headers: { apikey: key },
        signal: AbortSignal.timeout(3_000),
      });
      healthy = response.ok;
    } catch {
      healthy = false;
    }
  }

  return NextResponse.json(
    { status: healthy ? "ok" : "degraded" },
    { headers: { "Cache-Control": "no-store" }, status: healthy ? 200 : 503 },
  );
}
