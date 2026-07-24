import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { identityVerificationSchema } from "@/lib/validation/profile";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, identityVerificationSchema);
  if (!parsed.ok) return parsed.response;

  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return fail("Le service Yobalelma n'est pas encore disponible.", 503);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Connecte-toi pour soumettre une vérification d'identité.", 401);

  const expectedPathPrefix = `${user.id}/`;
  const documents = [
    { kind: "front", path: parsed.data.frontFilePath },
    { kind: "back", path: parsed.data.backFilePath },
    { kind: "selfie", path: parsed.data.selfieFilePath },
    { kind: "passport", path: parsed.data.passportFilePath },
  ].filter((item): item is { kind: "front" | "back" | "selfie" | "passport"; path: string } => Boolean(item.path));

  if (documents.some(({ path }) => !path.startsWith(expectedPathPrefix) || path.includes("..") || path.includes("\\"))) {
    return fail("Un document sélectionné ne peut pas être rattaché à ton dossier.", 403);
  }

  const { data: verificationId, error } = await callSupabaseRpc<string>(
    supabase,
    "submit_identity_verification",
    {
      p_document_number: parsed.data.documentNumber || "",
      p_document_type: parsed.data.documentType,
      p_documents: documents,
      p_expires_on: parsed.data.expiresOn,
      p_issuing_country: parsed.data.issuingCountry,
    },
  );

  if (error || !verificationId) {
    return fail(
      "Le dossier ne peut pas encore être soumis. Vérifie que tous les documents requis ont terminé leurs contrôles de sécurité.",
      422,
    );
  }

  return ok("Vérification d'identité soumise pour contrôle.", { verificationId });
}
