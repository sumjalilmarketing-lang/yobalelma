import { redirect } from "next/navigation";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await tryCreateSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/");
}
