import { UserAppInfoPage } from "@/apps/user-app/src/components/user-app-info-page";

export const metadata = {
  title: "Confidentialite | Yobalelma",
};

export default function Page() {
  return (
    <UserAppInfoPage
      eyebrow="Donnees"
      title="Confidentialite"
      description="Yobalelma limite les donnees visibles publiquement et separe les informations sensibles par role."
      bullets={[
        "Le suivi public n’affiche ni adresse complète ni document d’identité.",
        "L’accès privé reste limité au compte concerné.",
        "Les informations sensibles sont protégées."
]}
    />
  );
}
