import Link from "next/link";
import { PackageCheck, Search, ShieldCheck } from "lucide-react";
import { DataCard, DataGrid } from "@/components/operations/status-panels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicTrackingShipment } from "@/lib/tracking/public-view";

export function TrackingSearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form
      action="/suivi"
      className="grid gap-3 rounded-lg border border-black/10 bg-white p-5 shadow-line md:grid-cols-[1fr_auto]"
    >
      <label className="grid gap-2">
        <span className="text-sm font-bold uppercase text-black/50">Code de suivi</span>
        <Input
          name="code"
          defaultValue={defaultValue}
          placeholder="YBL-1234ABCD"
          aria-label="Code de suivi Yobalelma"
        />
      </label>
      <Button type="submit" className="self-end">
        <Search className="h-4 w-4" aria-hidden="true" />
        Suivre
      </Button>
    </form>
  );
}

export function TrackingResult({ shipment }: { shipment: PublicTrackingShipment }) {
  return (
    <div className="grid gap-6">
      <DataGrid>
        <DataCard
          title={shipment.trackingCode}
          subtitle={shipment.statusLabel}
          rows={[
            { label: "Depart", value: shipment.origin },
            { label: "Destination", value: shipment.destination },
            { label: "Portee", value: shipment.scope },
            { label: "Delai estime", value: shipment.eta },
            {
              label: "Derniere mise a jour",
              value: new Date(shipment.updatedAt).toLocaleString("fr-FR"),
            },
          ]}
        />
        <article className="rounded-lg border border-black/10 bg-secondary p-5 text-white shadow-panel">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-white">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-black">Donnees protegees</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Le suivi public affiche uniquement le statut, les villes et les evenements
                operationnels. Les noms, telephones, adresses, OTP, documents et valeurs
                declarees restent prives.
              </p>
            </div>
          </div>
        </article>
      </DataGrid>

      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-line">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
            <PackageCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold uppercase text-black/50">Timeline publique</p>
            <h2 className="text-2xl font-black">Statut du colis</h2>
          </div>
        </div>
        {shipment.events.length > 0 ? (
          <ol className="mt-5 grid gap-3">
            {shipment.events.map((event) => (
              <li
                key={event.id}
                className="grid gap-1 rounded-md border border-black/10 bg-muted p-4 md:grid-cols-[1fr_auto] md:items-center"
              >
                <span className="font-bold">{event.label}</span>
                <time className="text-sm font-semibold text-black/55">
                  {new Date(event.timestamp).toLocaleString("fr-FR")}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-5 leading-7 text-black/60">
            Aucun evenement public supplementaire n&apos;est encore disponible.
          </p>
        )}
      </section>

      <Button asChild variant="secondary" className="w-fit">
        <Link href={`/suivi/${shipment.trackingCode}`}>Lien public permanent</Link>
      </Button>
    </div>
  );
}
