import type { NextRequest } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { requestRedirect } from "@hub-app/src/lib/http";
import { hubSessionCookie } from "@hub-app/src/lib/session-token";

export async function POST(request: NextRequest) {
  const supabase = await tryCreateSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  const response = requestRedirect(request, "/auth/sign-in");

  response.cookies.set(hubSessionCookie, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
