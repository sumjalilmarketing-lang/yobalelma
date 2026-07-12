import { UserAppInfoPage } from "@/apps/user-app/src/components/user-app-info-page";

export const metadata = {
  title: "Tarification | Yobalelma",
};

export default function Page() {
  return (
    <UserAppInfoPage
      eyebrow="Prix"
      title="Tarification"
      description="Le prix MVP est estime selon le trajet, le poids facturable, la valeur declaree, la fragilite et le niveau de service."
      bullets={[
        "Meme pays: expedition nationale.",
        "Pays differents: expedition internationale.",
        "Paiement sandbox/manual avant branchement provider."
]}
    />
  );
}
