import { NextResponse, type NextRequest } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("probe") === "1") return NextResponse.json({ status: "starting" }, { headers: { "Cache-Control": "no-store" } });
  const supabase = await tryCreateSupabaseServerClient(); let status = "unconfigured";
  if (supabase) { const result = await supabase.from("collection_routes").select("id", { count: "exact", head: true }); status = result.error ? "degraded" : "ok"; }
  return NextResponse.json({ status: status === "ok" ? "ok" : "degraded" }, { headers: { "Cache-Control": "no-store" }, status: status === "ok" ? 200 : 503 });
}
