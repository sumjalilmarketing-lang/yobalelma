import { NextResponse, type NextRequest } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { requestOrigin } from "@admin-app/src/lib/security";

export async function POST(request: NextRequest) {
  const supabase = await tryCreateSupabaseServerClient();
  await supabase?.auth.signOut();
  return NextResponse.redirect(new URL("/auth/sign-in", requestOrigin(request)), { status: 303 });
}
