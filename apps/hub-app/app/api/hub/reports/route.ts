import { NextResponse, type NextRequest } from "next/server";
import { exportReportsCsv, getHubSnapshot } from "@hub-app/src/lib/hub-store";
import { requireHubApiSession } from "@hub-app/src/lib/http";
import { loadLiveHubState } from "@hub-app/src/lib/live-hub-data";
import { canUseHubFixture } from "@hub-app/src/lib/live-hub-actions";

export async function GET(request: NextRequest) {
  const session = await requireHubApiSession(request);
  if (canUseHubFixture(session)) {
    if (request.nextUrl.searchParams.get("format") === "csv") return new NextResponse(exportReportsCsv(), { headers: { "Content-Disposition": "attachment; filename=hub-report.csv", "Content-Type": "text/csv; charset=utf-8" } });
    return NextResponse.json(getHubSnapshot());
  }
  const state = await loadLiveHubState(session);
  if (!state) return NextResponse.json({ error: "Le rapport n’est pas disponible pour le moment." }, { status: 503 });

  if (request.nextUrl.searchParams.get("format") === "csv") {
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const csv = ["Indicateur,Valeur,Unité", ...state.reports.map((item) => [item.label, item.value, item.unit].map(escape).join(","))].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Disposition": "attachment; filename=hub-report.csv",
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }

  return NextResponse.json({ generatedAt: new Date().toISOString(), reports: state.reports });
}
