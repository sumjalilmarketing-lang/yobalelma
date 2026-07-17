import { NextResponse, type NextRequest } from "next/server";
import { exportReportsCsv, getHubSnapshot } from "@hub-app/src/lib/hub-store";
import { requireHubApiSession } from "@hub-app/src/lib/http";

export async function GET(request: NextRequest) {
  await requireHubApiSession(request);

  if (request.nextUrl.searchParams.get("format") === "csv") {
    return new NextResponse(exportReportsCsv(), {
      headers: {
        "Content-Disposition": "attachment; filename=hub-report.csv",
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }

  return NextResponse.json(getHubSnapshot());
}
