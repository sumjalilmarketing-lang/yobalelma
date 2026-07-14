import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { supportMessageSchema } from "@/lib/validation/operations";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, supportMessageSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour repondre au support.", 401);
  }

  const { error } = await supabase.from("support_messages").insert({
    author_id: user.id,
    body: parsed.data.message,
    ticket_id: parsed.data.ticketId,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Message ajoute au ticket.");
}
