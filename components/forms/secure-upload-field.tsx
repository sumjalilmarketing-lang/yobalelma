"use client";

import { UploadCloud } from "lucide-react";
import { useState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ApiResult } from "@/lib/api/responses";

type UploadPreparation = {
  path: string;
  token: string;
};

export function SecureUploadField({
  accept,
  bucket,
  label,
  onUploaded,
}: {
  accept: string;
  bucket: "kyc-documents" | "shipment-images" | "flight-tickets";
  label: string;
  onUploaded: (path: string) => void;
}) {
  const [message, setMessage] = useState<string>();
  const [tone, setTone] = useState<"success" | "error">("success");
  const [uploading, setUploading] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) {
      return;
    }

    setUploading(true);
    setMessage(undefined);

    try {
      const preparationResponse = await fetch("/api/storage/signed-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket, fileName: file.name }),
      });
      const preparation = (await preparationResponse.json()) as ApiResult<UploadPreparation>;

      if (!preparation.ok || !preparation.data) {
        setTone("error");
        setMessage(preparation.message);
        return;
      }

      const client = createSupabaseBrowserClient();
      const { error } = await client.storage
        .from(bucket)
        .uploadToSignedUrl(preparation.data.path, preparation.data.token, file, {
          contentType: file.type || undefined,
        });

      if (error) {
        setTone("error");
        setMessage(error.message);
        return;
      }

      onUploaded(preparation.data.path);
      setTone("success");
      setMessage("Document ajouté en toute sécurité.");
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : undefined);
    } finally {
      setUploading(false);
    }
  }

  return (
    <label className="grid gap-2 rounded-md border border-black/10 bg-white p-4 text-sm font-semibold">
      <span className="flex items-center gap-2">
        <UploadCloud className="h-4 w-4 text-primary" aria-hidden="true" />
        {label}
      </span>
      <input
        type="file"
        accept={accept}
        disabled={uploading}
        className="block w-full rounded-md border border-black/10 bg-muted px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:font-bold file:text-white"
        onChange={(event) => void upload(event.target.files?.[0])}
      />
      <span className="text-xs font-medium text-black/50">
        {uploading ? "Ajout en cours…" : "Formats acceptés : image ou PDF."}
      </span>
      <FormMessage message={message} tone={tone} />
    </label>
  );
}
