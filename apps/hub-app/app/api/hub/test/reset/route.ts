import { NextResponse, type NextRequest } from "next/server";
import { resetHubState } from "@hub-app/src/lib/hub-store";
import { requireHubApiSession } from "@hub-app/src/lib/http";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unavailable in production." }, { status: 404 });
  }

  await requireHubApiSession(request);

  return NextResponse.json({ ok: true, snapshot: resetHubState() });
}
