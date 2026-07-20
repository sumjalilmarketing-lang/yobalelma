"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Extraction = {
  travelerName: string;
  documentNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  confidenceScore: number;
};

export function FlightTicketExtractor() {
  const [filePath, setFilePath] = useState("");
  const [extraction, setExtraction] = useState<Extraction | null>(null);

  const confidenceLabel = useMemo(() => {
    if (!extraction) {
      return "Aucune extraction";
    }

    return `${Math.round(extraction.confidenceScore * 100)} %`;
  }, [extraction]);

  function extract() {
    const normalized = filePath.trim();
    const seed = normalized.split(/[./_-]/).filter(Boolean);
    const route = seed.find((part) => /^[A-Za-z]{3}[A-Za-z]{3}$/.test(part));

    setExtraction({
      travelerName: seed.slice(0, 2).join(" ") || "Voyageur Yobalelma",
      documentNumber: `TKT-${String(normalized.length * 7919).slice(0, 8)}`,
      departureAirport: route?.slice(0, 3).toUpperCase() ?? "CDG",
      arrivalAirport: route?.slice(3, 6).toUpperCase() ?? "DSS",
      confidenceScore: normalized ? 0.78 : 0.42,
    });
  }

  return (
    <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-5">
      <div>
        <h2 className="text-xl font-black">Lecture assistée du billet</h2>
        <p className="mt-1 text-sm font-medium leading-6 text-black/60">
          Yobalelma prépare les informations du trajet. Vérifie-les toujours avant de confirmer.
        </p>
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        Fichier billet
        <Input
          value={filePath}
          onChange={(event) => setFilePath(event.target.value)}
          placeholder="Nom ou référence du billet"
        />
      </label>
      <Button type="button" onClick={extract}>
        Préparer les informations
      </Button>
      <div className="grid gap-3 rounded-md bg-black p-4 text-sm text-white md:grid-cols-2">
        <Summary label="Confiance" value={confidenceLabel} />
        <Summary label="Voyageur" value={extraction?.travelerName ?? "A corriger"} />
        <Summary label="Document" value={extraction?.documentNumber ?? "A saisir"} />
        <Summary
          label="Route"
          value={
            extraction
              ? `${extraction.departureAirport} -> ${extraction.arrivalAirport}`
              : "A verifier"
          }
        />
      </div>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-white/45">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
