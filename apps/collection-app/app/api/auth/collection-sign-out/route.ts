import { NextResponse, type NextRequest } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { collectionSessionCookie } from "@collection-app/src/lib/session-token";
import { requestOrigin } from "@collection-app/src/lib/security";
export async function POST(request: NextRequest) {
  const supabase = await tryCreateSupabaseServerClient(); if (supabase) await supabase.auth.signOut();
  const response = NextResponse.redirect(new URL("/auth/sign-in", requestOrigin(request)), { status: 303 });
  response.cookies.set(collectionSessionCookie, "", { httpOnly: true, maxAge: 0, path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" }); return response;
}
