import { fail, ok, validationFail } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import {
  notificationCreateSchema,
  notificationReadSchema,
} from "@/lib/validation/operations";

export async function GET() {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour consulter tes notifications.", 401);
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, channel, status, title, body, action_url, read_at, created_at, shipment_id")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Notifications chargees.", { notifications: data });
}

export async function POST(request: Request) {
  const parsed = notificationCreateSchema.safeParse(await request.json());

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
    return fail("Connecte-toi pour creer une notification.", 401);
  }

  const { data, error } = await supabase.rpc("create_notification", {
    p_action_url: parsed.data.actionUrl || null,
    p_body: parsed.data.body,
    p_channel: parsed.data.channel,
    p_metadata: {},
    p_recipient_id: parsed.data.recipientId,
    p_shipment_id: parsed.data.shipmentId || null,
    p_title: parsed.data.title,
    p_type: parsed.data.type,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Notification creee.", { notificationId: data });
}

export async function PATCH(request: Request) {
  const parsed = notificationReadSchema.safeParse(await request.json());

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
    return fail("Connecte-toi pour modifier une notification.", 401);
  }

  const { data, error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: parsed.data.notificationId,
  });

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Notification marquee comme lue.", { notificationId: data });
}
