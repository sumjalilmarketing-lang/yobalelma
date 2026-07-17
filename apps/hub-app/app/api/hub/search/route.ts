import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireHubSession } from "@hub-app/src/lib/auth";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { callSupabaseRpc } from "@hub-app/src/lib/supabase-loose";
import { loadEnterpriseHubState } from "@hub-app/src/lib/enterprise-data";

const querySchema = z.object({ q: z.string().trim().min(2).max(120), hub: z.string().uuid().or(z.literal("")).optional(), page: z.coerce.number().int().min(1).max(1000).default(1) });

export async function GET(request: NextRequest) {
  const session = await requireHubSession("/api/hub/search", "GET");
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid search", issues: parsed.error.flatten() }, { status: 400 });
  const client = await tryCreateSupabaseServerClient();
  if (!client || session.source !== "supabase") {
    const state = await loadEnterpriseHubState(session);
    const q = parsed.data.q.toLocaleLowerCase();
    const results = [
      ...state.incidents.map((item) => ({ entity_type: "incident", entity_id: item.id, label: item.code, subtitle: item.title, href: `/hub/incidents?focus=${item.id}` })),
      ...state.hubs.map((item) => ({ entity_type: "hub", entity_id: item.id, label: item.code, subtitle: `${item.city}, ${item.country}`, href: `/hub/control-tower?hub=${item.id}` })),
      ...state.alerts.map((item) => ({ entity_type: "alert", entity_id: item.id, label: item.title, subtitle: item.message, href: `/hub/alerts?focus=${item.id}` })),
    ].filter((item) => `${item.label} ${item.subtitle}`.toLocaleLowerCase().includes(q)).slice(0, 30);
    return NextResponse.json({ query: parsed.data.q, page: parsed.data.page, results, source: "demo" });
  }
  const started = performance.now();
  const { data, error } = await callSupabaseRpc(client, "search_hub_enterprise", { p_query: parsed.data.q, p_hub_id: parsed.data.hub || null, p_limit: 30, p_offset: (parsed.data.page - 1) * 30 });
  if (error) return NextResponse.json({ error: "Search temporarily unavailable", correlationId: crypto.randomUUID() }, { status: 503 });
  return NextResponse.json({ query: parsed.data.q, page: parsed.data.page, durationMs: Math.round(performance.now() - started), results: data ?? [], source: "supabase" }, { headers: { "Cache-Control": "private, max-age=10" } });
}
