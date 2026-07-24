import { UserAppInfoPage } from "@/apps/user-app/src/components/user-app-info-page";

export const metadata = {
  title: "Tarification | Yobalelma",
};

export default function Page() {
  return (
    <UserAppInfoPage
      eyebrow="Prix"
      title="Tarification"
      description="Le prix est estimé selon le trajet, le poids facturable, la valeur déclarée, la fragilité et le niveau de service."
      bullets={[
        "Meme pays: expedition nationale.",
        "Pays differents: expedition internationale.",
        "Le récapitulatif complet est présenté avant toute confirmation."
]}
    />
  );
}
