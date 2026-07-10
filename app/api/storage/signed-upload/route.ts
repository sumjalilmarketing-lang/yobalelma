import { z } from "zod";
import { fail, ok, validationFail } from "@/lib/api/responses";
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
  path: z.string().trim().min(3).max(500),
});

export async function POST(request: Request) {
  const parsed = signedUploadSchema.safeParse(await request.json());

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
    return fail("Connecte-toi pour preparer un televersement.", 401);
  }

  const expectedPrefix = `${user.id}/`;

  if (!parsed.data.path.startsWith(expectedPrefix)) {
    return fail("Le chemin du fichier doit commencer par ton identifiant utilisateur.", 403);
  }

  const { data, error } = await supabase.storage
    .from(parsed.data.bucket)
    .createSignedUploadUrl(parsed.data.path);

  if (error) {
    return fail(error.message, 400);
  }

  return ok("URL signee creee.", data);
}
