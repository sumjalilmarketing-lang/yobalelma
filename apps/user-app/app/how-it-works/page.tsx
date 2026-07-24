import { UserAppInfoPage } from "@/apps/user-app/src/components/user-app-info-page";

export const metadata = {
  title: "Comment ca marche | Yobalelma",
};

export default function Page() {
  return (
    <UserAppInfoPage
      eyebrow="Parcours"
      title="Comment ca marche"
      description="Yobalelma organise l'envoi, l'enlevement, le relais, le voyage et le suivi dans un parcours clair."
      bullets={[
        "Création guidée du colis et de son trajet.",
        "Choix depot relais ou enlevement a domicile.",
        "Suivi public et prive avec evenements horodates."
]}
    />
  );
}
