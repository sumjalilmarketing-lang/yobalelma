"use client";

import { useState } from "react";
import { FormMessage } from "@/components/forms/form-message";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ApiResult } from "@/lib/api/responses";

type QrScanResponse = ApiResult<{
  result?: {
    batch_id?: string;
    token_id?: string;
    token_type?: string;
  } | null;
}>;

export function DestinationQrScanForm() {
  const [result, setResult] = useState<QrScanResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(formData: FormData) {
    setSubmitting(true);
    setResult(null);

    const response = await fetch("/api/qr/scan", {
      body: JSON.stringify({
        expectedTokenType: "destination_dropoff",
        incidentType: formData.get("incidentType") || undefined,
        note: formData.get("note") || undefined,
        token: formData.get("token"),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    setResult((await response.json()) as QrScanResponse);
    setSubmitting(false);
  }

  return (
    <form action={submit} className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-line">
      <div>
        <h2 className="text-lg font-black">Scan QR destination</h2>
        <p className="mt-1 text-sm font-medium leading-6 text-black/60">
          Colle le payload QR destination presente par le voyageur. Le serveur valide le token,
          marque le lot comme arrive et journalise les colis rattaches.
        </p>
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        Payload QR
        <Textarea name="token" rows={5} required />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Incident optionnel
        <Select name="incidentType" defaultValue="">
          <option value="">Aucun incident</option>
          <option value="damaged_package">Colis endommage</option>
          <option value="missing_package">Colis manquant</option>
          <option value="wrong_destination">Destination incoherente</option>
          <option value="qr_issue">Probleme QR</option>
        </Select>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Note de reception
        <Textarea name="note" rows={3} />
      </label>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Scan en cours..." : "Scanner le QR destination"}
      </Button>
      {result?.ok && result.data?.result ? (
        <p className="rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
          Lot confirme : {result.data.result.batch_id ?? "lot lie au token"}
        </p>
      ) : null}
      <FormMessage message={result?.message} tone={result ? (result.ok ? "success" : "error") : "info"} />
    </form>
  );
}
