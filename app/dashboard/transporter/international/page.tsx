import { InternationalDashboardPage } from "@/components/international/international-dashboard-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "International livreur | Yobalelma",
};

export default async function TransporterInternationalPage() {
  return (
    <InternationalDashboardPage
      allowedRoles={["local_transporter"]}
      eyebrow="Livreur local"
      title="Premier kilometre international"
      description="Accepte, recupere et remet les colis internationaux avant leur passage au relais origine."
      returnTo="/dashboard/transporter/international"
      scene="transporter"
    />
  );
}
