import { ProfileForm } from "@/components/forms/profile-form";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigurationNotice } from "@/components/operations/status-panels";
import { requireRole } from "@/lib/auth/server";
import type { PlatformRole } from "@/lib/auth/roles";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

const profileLabels = {
  client: { eyebrow: "Client", title: "Mon profil" },
  local_transporter: { eyebrow: "Livreur", title: "Mon profil professionnel" },
  traveler: { eyebrow: "Voyageur", title: "Mon profil voyageur" },
} as const;

type UserProfileRole = keyof typeof profileLabels;

export async function UserProfilePage({ role }: { role: UserProfileRole }) {
  const area = role === "local_transporter" ? "transporter" : role;
  const state = await requireRole([role as PlatformRole], `/${area}/profile`);
  const labels = profileLabels[role];

  if (state.status !== "ready") {
    return <UnavailableProfile eyebrow={labels.eyebrow} title={labels.title} />;
  }

  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) {
    return <UnavailableProfile eyebrow={labels.eyebrow} title={labels.title} />;
  }

  const { data } = await supabase
    .from("profiles")
    .select("full_name, phone, city, country, address_line1, preferred_language")
    .eq("id", state.userId)
    .maybeSingle();

  return (
    <PageShell
      eyebrow={labels.eyebrow}
      title={labels.title}
      description="Gérez vos coordonnées et vos préférences personnelles."
    >
      <div className="rounded-lg border border-black/10 bg-white p-5 shadow-line">
        <ProfileForm
          initialValues={{
            fullName: data?.full_name ?? "",
            phone: data?.phone ?? "",
            city: data?.city ?? "",
            country: data?.country ?? "",
            address: data?.address_line1 ?? "",
            preferredLanguage: data?.preferred_language === "en" ? "en" : "fr",
          }}
        />
      </div>
    </PageShell>
  );
}

function UnavailableProfile({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <PageShell
      eyebrow={eyebrow}
      title={title}
      description="Gérez vos coordonnées et vos préférences personnelles."
    >
      <ConfigurationNotice />
    </PageShell>
  );
}
