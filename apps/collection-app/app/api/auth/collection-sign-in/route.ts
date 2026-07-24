import { NextResponse, type NextRequest } from "next/server";
import { createDemoCollectionSession } from "@collection-app/src/lib/auth";
import { collectionSessionCookie } from "@collection-app/src/lib/session-token";
import { assertSameOrigin, rateLimit, requestOrigin } from "@collection-app/src/lib/security";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); rateLimit(request, 10, 60_000);
    if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = await request.formData(); const returnTo = safePath(data.get("returnTo"));
    const { token } = await createDemoCollectionSession(String(data.get("email") ?? ""), String(data.get("code") ?? ""), String(data.get("role") ?? ""));
    const response = NextResponse.redirect(new URL(returnTo, requestOrigin(request)), { status: 303 });
    response.cookies.set(collectionSessionCookie, token, { httpOnly: true, maxAge: 28_800, path: "/", sameSite: "lax", secure: isSecureRequest(request) });
    return response;
  } catch (error) { return fail(request, error); }
}
function safePath(value: FormDataEntryValue | null) { return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/collection"; }
function isSecureRequest(request: NextRequest) { return (request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? request.nextUrl.protocol.replace(":", "")) === "https"; }
function fail(request: NextRequest, error: unknown) { void error; const url = new URL("/auth/sign-in", requestOrigin(request)); url.searchParams.set("error", "Les informations de connexion sont incorrectes."); return NextResponse.redirect(url, { status: 303 }); }
