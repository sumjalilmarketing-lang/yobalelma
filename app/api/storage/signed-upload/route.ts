import { z } from "zod";
import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { toUserFacingMessage } from "@/lib/presentation/user-facing-copy";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

const signedUploadSchema = z.object({
  bucket: z.enum([
    "avatars",
    "shipment-images",
    "kyc-documents",
    "flight-tickets",
    "proof-of-delivery",
    "dispute-evidence",
    "hub-inspection-images",
  ]),
  fileName: z.string().trim().min(1).max(180).optional(),
  path: z.string().trim().min(3).max(500).optional(),
}).refine((value) => value.path || value.fileName, {
  message: "Sélectionne un fichier à ajouter.",
});

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, signedUploadSchema);

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
    return fail("Connecte-toi pour preparer un televersement.", 401);
  }

  const expectedPrefix = `${user.id}/`;
  const safeFileName = parsed.data.fileName
    ?.normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  const path = parsed.data.path ?? `${expectedPrefix}${crypto.randomUUID()}-${safeFileName || "document"}`;

  if (!path.startsWith(expectedPrefix)) {
    return fail("Ce document ne peut pas être ajouté à ton dossier.", 403);
  }

  const { data, error } = await supabase.storage
    .from(parsed.data.bucket)
    .createSignedUploadUrl(path);

  if (error) {
    return fail(toUserFacingMessage(error.message), 400);
  }

  return ok("Le document est prêt à être ajouté.", { ...data, path });
}
