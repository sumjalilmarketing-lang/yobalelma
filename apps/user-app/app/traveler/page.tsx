import { ExternalRoleHome } from "@/apps/user-app/src/components/external-role-home";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Espace voyageur Yobalelma | Yobalelma",
};

export default async function Page() {
  return (
    <ExternalRoleHome
      role="traveler"
      returnTo="/traveler"
      title="Espace voyageur Yobalelma"
      roleLabel="Espace voyageur"
      description="Publie tes voyages, declare ta capacite, consulte tes lots, QR et gains."
      scene="traveler"
      actions={[
        {
                "href": "/traveler/trips/new",
                "label": "Ajouter un voyage"
        },
        {
                "href": "/traveler/trips",
                "label": "Mes voyages",
                "variant": "secondary"
        },
        {
                "href": "/traveler/tickets",
                "label": "Billets",
                "variant": "secondary"
        },
        {
                "href": "/traveler/capacity",
                "label": "Capacite",
                "variant": "secondary"
        },
        {
                "href": "/traveler/assignments",
                "label": "Assignations",
                "variant": "secondary"
        },
        {
                "href": "/traveler/qr-codes",
                "label": "QR codes",
                "variant": "secondary"
        },
        {
                "href": "/traveler/earnings",
                "label": "Gains",
                "variant": "secondary"
        }
]}
      checkpoints={[
        "Identité vérifiée avant la première remise.",
        "Billet contrôlé par l’équipe Yobalelma.",
        "Capacité disponible clairement indiquée."
]}
    />
  );
}
