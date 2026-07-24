import { UserAppInfoPage } from "@/apps/user-app/src/components/user-app-info-page";

export const metadata = {
  title: "Conditions d'utilisation | Yobalelma",
};

export default function Page() {
  return (
    <UserAppInfoPage
      eyebrow="Legal"
      title="Conditions d'utilisation"
      description="Ces conditions précisent les responsabilités de l’expéditeur, du livreur et du voyageur."
      bullets={[
        "Identite exacte et contenu declare requis.",
        "Respect des regles douanieres et de transport.",
        "Les preuves et le suivi permettent de résoudre les litiges."
]}
    />
  );
}
