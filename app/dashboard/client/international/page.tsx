import { InternationalDashboardPage } from "@/components/international/international-dashboard-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "International client | Yobalelma",
};

export default async function ClientInternationalPage() {
  return (
    <InternationalDashboardPage
      allowedRoles={["client"]}
      eyebrow="Client"
      title="Parcours international client"
      description="Cree, suis et controle un envoi international depuis la detection automatique jusqu'a la preuve de destination."
      returnTo="/dashboard/client/international"
      scene="client"
    />
  );
}
