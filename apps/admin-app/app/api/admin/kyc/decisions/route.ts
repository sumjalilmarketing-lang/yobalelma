import { z } from "zod";
import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

const decisionSchema = z.object({
  comment: z.string().trim().max(1000).default(""),
  decision: z.enum(["approved", "rejected", "needs_more_information"]),
  verificationId: z.string().uuid(),
}).strict().superRefine((value, context) => {
  if (value.decision !== "approved" && value.comment.length < 8) {
    context.addIssue({ code: "custom", message: "Une justification détaillée est obligatoire.", path: ["comment"] });
  }
});

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, decisionSchema);
  if (!parsed.ok) return parsed.response;

  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Connecte-toi pour examiner ce dossier.", 401);

  const { error } = await callSupabaseRpc(supabase, "review_identity_verification", {
    p_comment: parsed.data.comment,
    p_decision: parsed.data.decision,
    p_verification_id: parsed.data.verificationId,
  });
  if (error) return fail("Cette décision ne peut pas être enregistrée depuis ton espace.", 403);
  return ok("Décision enregistrée et auditée.");
}
