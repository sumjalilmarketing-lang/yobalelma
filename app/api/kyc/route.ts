import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { identityVerificationSchema } from "@/lib/validation/profile";

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, identityVerificationSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Supabase n'est pas encore configure dans l'environnement local.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour soumettre une verification d'identite.", 401);
  }

  const { data: verification, error } = await supabase
    .from("identity_verifications")
    .insert({
      profile_id: user.id,
      document_type: parsed.data.documentType,
      document_number: parsed.data.documentNumber || null,
      issuing_country: parsed.data.issuingCountry,
      expires_on: parsed.data.expiresOn,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !verification) {
    return fail(error?.message ?? "Verification impossible.", 400);
  }

  const documents = [
    { kind: "front", path: parsed.data.frontFilePath },
    { kind: "back", path: parsed.data.backFilePath },
    { kind: "selfie", path: parsed.data.selfieFilePath },
    { kind: "passport", path: parsed.data.passportFilePath },
  ].filter((item): item is { kind: "front" | "back" | "selfie" | "passport"; path: string } =>
    Boolean(item.path),
  );

  if (documents.length > 0) {
    const { error: documentsError } = await supabase
      .from("identity_verification_documents")
      .insert(
        documents.map((document) => ({
          verification_id: verification.id,
          profile_id: user.id,
          document_kind: document.kind,
          storage_bucket: "kyc-documents",
          storage_path: document.path,
        })),
      );

    if (documentsError) {
      return fail(documentsError.message, 400);
    }
  }

  await supabase.from("identity_verification_decisions").insert({
    verification_id: verification.id,
    actor_id: user.id,
    decision: "submitted",
    comment: "Soumission utilisateur.",
  });

  return ok("Verification d'identite soumise pour controle.");
}

