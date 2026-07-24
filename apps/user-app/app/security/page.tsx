import { UserAppInfoPage } from "@/apps/user-app/src/components/user-app-info-page";

export const metadata = {
  title: "Securite et confiance | Yobalelma",
};

export default function Page() {
  return (
    <UserAppInfoPage
      eyebrow="Confiance"
      title="Securite et confiance"
      description="Les profils, la vérification d’identité et les preuves protègent tes informations et tes colis."
      bullets={[
        "Chaque espace personnel est protégé.",
        "Les informations privées restent absentes du suivi public.",
        "Les documents sont réservés aux personnes autorisées."
]}
    />
  );
}
