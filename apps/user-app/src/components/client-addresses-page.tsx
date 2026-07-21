import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/page-shell";
import {
  ConfigurationNotice,
  DataCard,
  DataGrid,
  EmptyState,
} from "@/components/operations/status-panels";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export async function ClientAddressesPage() {
  const state = await requireRole(["client"], "/client/addresses");

  if (state.status !== "ready") {
    return (
      <AddressShell>
        <ConfigurationNotice />
      </AddressShell>
    );
  }

  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) {
    return (
      <AddressShell>
        <ConfigurationNotice />
      </AddressShell>
    );
  }

  const { data, error } = await supabase
    .from("shipment_addresses")
    .select("id, type, contact_name, contact_phone, address_line1, address_line2, city, postal_code, country, instructions, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const addresses = uniqueAddresses(data ?? []);

  return (
    <AddressShell>
      <div className="mb-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/client/shipments/new">Utiliser une nouvelle adresse</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/client/profile">Modifier mon adresse principale</Link>
        </Button>
      </div>
      {error ? (
        <EmptyState
          title="Adresses indisponibles"
          description="Vos adresses récentes ne peuvent pas être affichées pour le moment."
        />
      ) : addresses.length ? (
        <DataGrid>
          {addresses.map((address) => (
            <DataCard
              key={address.id}
              title={address.contact_name}
              subtitle={address.type === "pickup" ? "Adresse de départ" : "Adresse de destination"}
              rows={[
                {
                  label: "Adresse",
                  value: [address.address_line1, address.address_line2, address.postal_code, address.city, address.country]
                    .filter(Boolean)
                    .join(", "),
                },
                { label: "Téléphone", value: address.contact_phone },
                { label: "Instructions", value: address.instructions ?? "Aucune instruction" },
              ]}
            />
          ))}
        </DataGrid>
      ) : (
        <EmptyState
          title="Aucune adresse récente"
          description="Les adresses de vos expéditions apparaîtront ici."
          action={{ href: "/client/shipments/new", label: "Créer une expédition" }}
        />
      )}
    </AddressShell>
  );
}

function AddressShell({ children }: { children: ReactNode }) {
  return (
    <PageShell
      eyebrow="Client"
      title="Mes adresses"
      description="Retrouvez les coordonnées utilisées pour vos envois récents."
      scene="client"
    >
      {children}
    </PageShell>
  );
}

function uniqueAddresses<T extends {
  address_line1: string;
  city: string;
  contact_name: string;
  country: string;
  id: string;
  type: string;
}>(addresses: T[]) {
  const seen = new Set<string>();
  return addresses.filter((address) => {
    const key = [address.type, address.contact_name, address.address_line1, address.city, address.country]
      .join("|")
      .toLocaleLowerCase("fr");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
