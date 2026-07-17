"use client";

import { useEffect } from "react";

export default function HubError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(JSON.stringify({
      digest: error.digest ?? null,
      event: "hub_frontend_error",
      name: error.name,
    }));
  }, [error]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl rounded-lg border border-error/30 bg-white p-6 shadow-panel">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-error">Hub error</p>
        <h1 className="mt-2 text-3xl font-black">Operation interrompue</h1>
        <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
        <button
          className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-black text-primary-foreground"
          onClick={reset}
          type="button"
        >
          Reessayer
        </button>
      </div>
    </div>
  );
}
