import { z } from "zod";
import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { toUserFacingMessage } from "@/lib/presentation/user-facing-copy";
import { callSupabaseRpc } from "@/lib/supabase/rpc";
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
  contentType: z.string().trim().min(3).max(120),
  size: z.number().int().positive().max(15 * 1024 * 1024),
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
  const uploadRule = uploadRules[parsed.data.bucket];

  if (
    parsed.data.size > uploadRule.maxBytes ||
    !uploadRule.contentTypes.some((contentType: string) => contentType === parsed.data.contentType)
  ) {
    return fail("Ce format ou cette taille de fichier n’est pas accepté.", 422);
  }
  const safeFileName = parsed.data.fileName
    ?.normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  const path = parsed.data.path ?? `${expectedPrefix}${crypto.randomUUID()}-${safeFileName || "document"}`;

  if (!path.startsWith(expectedPrefix) || path.includes("..") || path.includes("\\")) {
    return fail("Ce document ne peut pas être ajouté à ton dossier.", 403);
  }

  const { data, error } = await supabase.storage
    .from(parsed.data.bucket)
    .createSignedUploadUrl(path);

  if (error) {
    return fail(toUserFacingMessage(error.message), 400);
  }

  const { error: registrationError } = await callSupabaseRpc<string>(
    supabase,
    "register_secure_upload",
    {
      p_bucket: parsed.data.bucket,
      p_declared_mime_type: parsed.data.contentType,
      p_declared_size_bytes: parsed.data.size,
      p_storage_path: path,
    },
  );

  if (registrationError) {
    return fail("Le contrôle de sécurité du document n’a pas pu être préparé.", 503);
  }

  return ok("Le document est prêt à être ajouté.", { ...data, path });
}

const imageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const documentTypes = [...imageTypes, "application/pdf"] as const;
const uploadRules = {
  avatars: { contentTypes: imageTypes, maxBytes: 5 * 1024 * 1024 },
  "shipment-images": { contentTypes: imageTypes, maxBytes: 10 * 1024 * 1024 },
  "kyc-documents": { contentTypes: documentTypes, maxBytes: 10 * 1024 * 1024 },
  "flight-tickets": { contentTypes: documentTypes, maxBytes: 10 * 1024 * 1024 },
  "proof-of-delivery": { contentTypes: documentTypes, maxBytes: 15 * 1024 * 1024 },
  "dispute-evidence": { contentTypes: documentTypes, maxBytes: 15 * 1024 * 1024 },
  "hub-inspection-images": { contentTypes: imageTypes, maxBytes: 10 * 1024 * 1024 },
} as const;
