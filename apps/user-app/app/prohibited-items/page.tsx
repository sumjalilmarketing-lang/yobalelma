import { UserAppInfoPage } from "@/apps/user-app/src/components/user-app-info-page";

export const metadata = {
  title: "Objets interdits | Yobalelma",
};

export default function Page() {
  return (
    <UserAppInfoPage
      eyebrow="Conformite"
      title="Objets interdits"
      description="Les produits dangereux, illegaux, non declares ou incompatibles avec le voyage sont interdits."
      bullets={[
        "Confirmation obligatoire dans le formulaire colis.",
        "Controle relais et hub prevu dans les workflows.",
        "Incident cree si le colis est refuse ou bloque."
]}
    />
  );
}
