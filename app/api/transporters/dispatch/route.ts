import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { getAuthState } from "@/lib/auth/server";
import { roleHasPermission } from "@/lib/auth/roles";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { dispatchMissionSchema } from "@/lib/validation/mission";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, dispatchMissionSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const auth = await getAuthState();

  if (auth.status === "needs-env") {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  if (auth.status === "signed-out") {
    return fail("Connecte-toi pour dispatcher une expedition.", 401);
  }

  if (!roleHasPermission(auth.role, "dispatch:write")) {
    return fail("Ton role ne permet pas de dispatcher une expedition.", 403);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90_000);
  const { data: pickupRequest } = await supabase
    .from("pickup_requests")
    .select("id")
    .eq("shipment_id", parsed.data.shipmentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: dispatchJob, error: dispatchJobError } = await supabase
    .from("dispatch_jobs")
    .insert({
      candidate_limit: parsed.data.candidateLimit,
      created_by: auth.userId,
      expires_at: expiresAt.toISOString(),
      metadata: { source: "api/transporters/dispatch" },
      pickup_request_id: pickupRequest?.id ?? null,
      shipment_id: parsed.data.shipmentId,
      started_at: now.toISOString(),
      status: "broadcasting",
    })
    .select("id")
    .single();

  if (dispatchJobError) {
    return fail(dispatchJobError.message, 400);
  }

  const { data, error } = await supabase.rpc("dispatch_local_delivery_missions", {
    p_candidate_limit: parsed.data.candidateLimit,
    p_shipment_id: parsed.data.shipmentId,
  });

  if (error) {
    await markDispatchJobForReview(supabase, dispatchJob.id, auth.userId, error.message);
    return fail(error.message, 400);
  }

  const missions = data ?? [];

  if (missions.length > 0) {
    const { error: candidatesError } = await supabase.from("dispatch_candidates").insert(
      missions.map((mission, index) => ({
        dispatch_job_id: dispatchJob.id,
        mission_id: mission.mission_id,
        notified_at: now.toISOString(),
        rank: index + 1,
        score: mission.score,
        score_breakdown: { source: "find_local_transporter_matches" },
        status: "notified",
        transporter_id: mission.transporter_id,
      })),
    );

    if (candidatesError) {
      await markDispatchJobForReview(
        supabase,
        dispatchJob.id,
        auth.userId,
        candidatesError.message,
      );
      return fail(candidatesError.message, 400);
    }

    await supabase.from("dispatch_events").insert({
      actor_id: auth.userId,
      dispatch_job_id: dispatchJob.id,
      event_type: "candidates_broadcast",
      message: `${missions.length} candidat(s) notifie(s).`,
      metadata: { candidate_limit: parsed.data.candidateLimit },
    });
  } else {
    await markDispatchJobForReview(
      supabase,
      dispatchJob.id,
      auth.userId,
      "Aucun transporteur compatible trouve.",
    );
  }

  return ok("Dispatch local execute.", {
    dispatchJobId: dispatchJob.id,
    missions,
  });
}

async function markDispatchJobForReview(
  supabase: NonNullable<Awaited<ReturnType<typeof tryCreateSupabaseServerClient>>>,
  dispatchJobId: string,
  actorId: string,
  reason: string,
) {
  await supabase
    .from("dispatch_jobs")
    .update({ metadata: { reason }, status: "manual_review" })
    .eq("id", dispatchJobId);

  await supabase.from("dispatch_events").insert({
    actor_id: actorId,
    dispatch_job_id: dispatchJobId,
    event_type: "manual_review",
    message: reason,
  });
}
