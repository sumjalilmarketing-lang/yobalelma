import { NextRequest, NextResponse } from "next/server";
import { requireHubSession } from "@hub-app/src/lib/auth";
import { loadEnterpriseHubState } from "@hub-app/src/lib/enterprise-data";
import { createExportTable, exportQuerySchema, toCsv, toExcelXml, toPdf, toPrintableHtml } from "@hub-app/src/lib/enterprise-export";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { fromSupabaseTable } from "@hub-app/src/lib/supabase-loose";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  const session = await requireHubSession("/api/hub/exports", "GET");
  const parsed = exportQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid export request", issues: parsed.error.flatten() }, { status: 400 });
  const state = await loadEnterpriseHubState(session);
  if (parsed.data.hub && !state.hubs.some((hub) => hub.id === parsed.data.hub)) return NextResponse.json({ error: "Hub access denied" }, { status: 403 });
  const table = createExportTable(state, parsed.data.type, parsed.data.hub || undefined);
  const timestamp = new Date().toISOString();
  const filename = `yobalelma-hub-${parsed.data.type}-${timestamp.slice(0, 10)}`;
  if (session.source === "supabase" && session.userId) {
    const client = await tryCreateSupabaseServerClient();
    if (client) await fromSupabaseTable(client, "hub_export_jobs").insert({ hub_id: parsed.data.hub || session.hubId, requested_by: session.userId, export_type: parsed.data.type, export_format: parsed.data.format, filters: { hub: parsed.data.hub || null }, status: "completed", row_count: table.rows.length, completed_at: timestamp });
  }
  const secureHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (parsed.data.format === "print") {
    const qr = await QRCode.toDataURL(`YBL-HUB-DOC:${parsed.data.type}:${timestamp}`, { errorCorrectionLevel: "H", margin: 1, width: 192 });
    return new NextResponse(toPrintableHtml(table, session.name, timestamp, qr), { headers: { ...secureHeaders, "Content-Type": "text/html; charset=utf-8" } });
  }
  if (parsed.data.format === "pdf") return new NextResponse(toPdf(table, session.name, timestamp), { headers: { ...secureHeaders, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}.pdf"` } });
  if (parsed.data.format === "xlsx") return new NextResponse(toExcelXml(table), { headers: { ...secureHeaders, "Content-Type": "application/vnd.ms-excel; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}.xml"` } });
  return new NextResponse(toCsv(table), { headers: { ...secureHeaders, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}.csv"` } });
}
