import { fail, ok, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { supportTicketSchema } from "@/lib/validation/operations";

export async function POST(request: Request) {
  const parsed = supportTicketSchema.safeParse(await request.json());

  if (!parsed.success) {
    return validationFail(parsed.error);
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour ouvrir un ticket support.", 401);
  }

  const { data, error } = await supabase.rpc("create_support_ticket", {
    p_category: parsed.data.category,
    p_initial_message: parsed.data.message,
    p_priority: parsed.data.priority,
    p_shipment_id: parsed.data.shipmentId || null,
    p_subject: parsed.data.subject,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Ticket support ouvert.", { ticketId: data });
}
