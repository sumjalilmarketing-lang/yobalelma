import { ExternalRoleHome } from "@/apps/user-app/src/components/external-role-home";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Espace livreur local | Yobalelma",
};

export default async function Page() {
  return (
    <ExternalRoleHome
      role="local_transporter"
      returnTo="/transporter"
      title="Espace livreur local"
      roleLabel="Espace livreur"
      description="Gere tes missions, ton vehicule, tes zones, ta disponibilite et tes gains."
      scene="transporter"
      actions={[
        {
                "href": "/transporter/missions",
                "label": "Mes missions"
        },
        {
                "href": "/transporter/missions/available",
                "label": "Missions disponibles",
                "variant": "secondary"
        },
        {
                "href": "/transporter/missions/active",
                "label": "Mission active",
                "variant": "secondary"
        },
        {
                "href": "/transporter/availability",
                "label": "Disponibilite",
                "variant": "secondary"
        },
        {
                "href": "/transporter/zones",
                "label": "Zones",
                "variant": "secondary"
        },
        {
                "href": "/transporter/vehicle",
                "label": "Vehicule",
                "variant": "secondary"
        },
        {
                "href": "/transporter/earnings",
                "label": "Gains",
                "variant": "secondary"
        },
        {
                "href": "/transporter/kyc",
                "label": "KYC",
                "variant": "secondary"
        }
]}
      checkpoints={[
        "Role livreur externe.",
        "KYC et vehicule requis.",
        "Acceptation de mission transactionnelle."
]}
    />
  );
}
