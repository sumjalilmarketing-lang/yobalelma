"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function PassportPdfButton({ reference }: { reference: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function download() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/traceability/passport-pdf?query=${encodeURIComponent(reference)}`, { credentials: "same-origin" });
      const result = await response.json() as { url?: string; message?: string };
      if (!response.ok || !result.url) throw new Error(result.message || "Export indisponible.");
      window.location.assign(result.url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Export indisponible."); }
    finally { setBusy(false); }
  }
  return <div className="flex flex-wrap items-center gap-3"><button className="min-h-11 rounded-xl border bg-background px-4 font-black" type="button" disabled={busy} onClick={download}><Download className="mr-2 inline h-4 w-4" />{busy ? "Préparation…" : "Exporter le PDF sécurisé"}</button>{error ? <p className="text-sm font-bold text-red-700" role="alert">{error}</p> : null}</div>;
}
