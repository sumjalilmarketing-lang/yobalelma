import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireHubApiSession } from "@hub-app/src/lib/http";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { fromSupabaseTable } from "@hub-app/src/lib/supabase-loose";

const alertActionSchema = z.object({ id: z.string().uuid(), intent: z.enum(["acknowledge", "resolve"]) });

export async function POST(request: NextRequest) {
  const session = await requireHubApiSession(request);
  const contentType = request.headers.get("content-type") ?? "";
  const input = contentType.includes("application/json") ? await request.json() : Object.fromEntries(await request.formData());
  const parsed = alertActionSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Invalid alert action", issues: parsed.error.flatten() }, { status: 400 });
  if (session.source !== "supabase") return NextResponse.json({ id: parsed.data.id, status: parsed.data.intent === "resolve" ? "resolved" : "acknowledged", source: "demo" });
  const client = await tryCreateSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Alert service unavailable" }, { status: 503 });
  const now = new Date().toISOString();
  const status = parsed.data.intent === "resolve" ? "resolved" : "acknowledged";
  const values = parsed.data.intent === "resolve" ? { status, resolved_at: now, updated_at: now } : { status, acknowledged_at: now, updated_at: now };
  const { error } = await fromSupabaseTable(client, "hub_alerts").update(values).eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: "Alert action denied" }, { status: 403 });
  return NextResponse.json({ id: parsed.data.id, status });
}
