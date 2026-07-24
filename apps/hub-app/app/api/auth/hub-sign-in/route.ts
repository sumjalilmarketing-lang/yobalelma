import { NextResponse, type NextRequest } from "next/server";
import { createDemoHubSession } from "@hub-app/src/lib/auth";
import { formString, redirectTo, requestOrigin, requestRedirect } from "@hub-app/src/lib/http";
import { hubSessionCookie } from "@hub-app/src/lib/session-token";
import { assertSameOrigin, rateLimit } from "@hub-app/src/lib/security";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    assertSameOrigin(request);
    rateLimit(request);
  } catch {
    return NextResponse.json({ error: "Request refused" }, { status: 429 });
  }

  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub");

  try {
    const { token } = await createDemoHubSession(
      formString(formData, "email"),
      formString(formData, "code"),
      formString(formData, "role"),
    );
    const response = requestRedirect(request, returnTo);

    response.cookies.set(hubSessionCookie, token, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: "/",
      sameSite: "lax",
      secure: false,
    });

    return response;
  } catch {
    const url = new URL("/auth/sign-in", requestOrigin(request));
    url.searchParams.set("next", returnTo);
    url.searchParams.set("error", "Les informations de formation sont incorrectes.");

    return NextResponse.redirect(url, { status: 303 });
  }
}
