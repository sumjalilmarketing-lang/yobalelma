import { ExternalRoleHome } from "@/apps/user-app/src/components/external-role-home";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Espace client Yobalelma | Yobalelma",
};

export default async function Page() {
  return (
    <ExternalRoleHome
      role="client"
      returnTo="/client"
      title="Espace client Yobalelma"
      roleLabel="Espace client"
      description="Prepare tes envois, suis tes colis, consulte tes paiements et contacte le support."
      scene="client"
      actions={[
        {
                "href": "/client/shipments/new",
                "label": "Envoyer un colis"
        },
        {
                "href": "/client/shipments",
                "label": "Mes expeditions",
                "variant": "secondary"
        },
        {
                "href": "/client/tracking",
                "label": "Suivi privé",
                "variant": "secondary"
        },
        {
                "href": "/client/payments",
                "label": "Paiements",
                "variant": "secondary"
        },
        {
                "href": "/client/addresses",
                "label": "Adresses",
                "variant": "secondary"
        },
        {
                "href": "/client/support",
                "label": "Support",
                "variant": "secondary"
        },
        {
                "href": "/client/notifications",
                "label": "Notifications",
                "variant": "secondary"
        }
]}
      checkpoints={[
        "Coordonnées personnelles à jour.",
        "Création guidée de chaque expédition.",
        "Suivi public et privé de tes colis."
]}
    />
  );
}
