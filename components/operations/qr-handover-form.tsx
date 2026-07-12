"use client";

import { useState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResult } from "@/lib/api/responses";

type QrResult = {
  expiresAt: string;
  qrPayload: string;
  qrSvg: string;
  tokenId: string;
  tokenType: "origin_pickup" | "destination_dropoff";
};

export function QrHandoverForm() {
  const [result, setResult] = useState<ApiResult<QrResult> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(formData: FormData) {
    setSubmitting(true);
    setResult(null);

    const payload = Object.fromEntries(
      [...formData.entries()].map(([key, value]) => [key, String(value)]),
    );

    const response = await fetch("/api/qr/handover", {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    setResult((await response.json()) as ApiResult<QrResult>);
    setSubmitting(false);
  }

  const qrDataUri =
    result?.ok && result.data?.qrSvg
      ? `data:image/svg+xml;utf8,${encodeURIComponent(result.data.qrSvg)}`
      : null;

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5">
      <div>
        <h2 className="text-lg font-black">Generer QR</h2>
        <p className="mt-1 text-sm font-medium leading-6 text-black/60">
          Cree un QR opaque a usage unique pour retrait origine ou depot destination.
        </p>
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        ID batch
        <Input name="batchId" required />
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        Type
        <Select name="tokenType" defaultValue="origin_pickup" required>
          <option value="origin_pickup">Retrait origine</option>
          <option value="destination_dropoff">Depot destination</option>
        </Select>
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        Expiration minutes
        <Input name="expiresInMinutes" type="number" defaultValue={30} min={5} max={240} />
      </label>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Generation..." : "Generer"}
      </Button>

      <FormMessage
        message={result?.message}
        tone={result ? (result.ok ? "success" : "error") : "info"}
      />

      {result?.ok && result.data ? (
        <section className="grid gap-4 rounded-md border border-black/10 bg-muted p-4">
          <div className="grid gap-1">
            <p className="text-sm font-bold uppercase text-black/50">Expiration</p>
            <p className="font-semibold">
              {new Date(result.data.expiresAt).toLocaleString("fr-FR")}
            </p>
          </div>

          {qrDataUri ? (
            // The SVG is generated server-side from an opaque token payload.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUri}
              alt="QR Yobalelma a scanner"
              className="aspect-square w-full max-w-72 rounded-md border border-black/10 bg-white p-3"
            />
          ) : null}

          <label className="grid gap-2 text-sm font-semibold">
            Payload scanner
            <Textarea readOnly value={result.data.qrPayload} className="min-h-28 font-mono text-xs" />
          </label>
        </section>
      ) : null}
    </form>
  );
}
