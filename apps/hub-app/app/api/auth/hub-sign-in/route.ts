import { NextResponse, type NextRequest } from "next/server";
import { createDemoHubSession } from "@hub-app/src/lib/auth";
import { formString, redirectTo, requestOrigin, requestRedirect } from "@hub-app/src/lib/http";
import { hubSessionCookie } from "@hub-app/src/lib/session-token";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.HUB_ENABLE_DEMO_AUTH !== "1") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    const url = new URL("/auth/sign-in", requestOrigin(request));
    url.searchParams.set("next", returnTo);
    url.searchParams.set("error", error instanceof Error ? error.message : "Connexion impossible.");

    return NextResponse.redirect(url, { status: 303 });
  }
}
