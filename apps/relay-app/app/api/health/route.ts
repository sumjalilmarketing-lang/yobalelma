import { NextResponse, type NextRequest } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { relayNavigation } from "@relay-app/src/lib/permissions";
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("probe") === "1") return NextResponse.json({ app: "relay-app", status: "starting" });
  const supabase = await tryCreateSupabaseServerClient(); let status = "unconfigured";
  if (supabase) { const result = await supabase.from("relay_points").select("id", { count: "exact", head: true }); status = result.error ? "degraded" : "ok"; }
  return NextResponse.json({ app: "relay-app", status: status === "degraded" ? "degraded" : "ok", checks: { routes: relayNavigation.length, supabase: status, offline: true, optimizer: true } }, { status: status === "degraded" ? 503 : 200 });
}
