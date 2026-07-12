import { UserAppInfoPage } from "@/apps/user-app/src/components/user-app-info-page";

export const metadata = {
  title: "Points relais | Yobalelma",
};

export default function Page() {
  return (
    <UserAppInfoPage
      eyebrow="Relais"
      title="Points relais"
      description="Les relais disponibles permettent de deposer un colis ou de recevoir une expedition avec controle et scan."
      bullets={[
        "Recherche par ville a finaliser avec les donnees relay_points.",
        "Instructions de depot generees lors de la creation.",
        "Reseaux relais configurables sans partenaire code en dur."
]}
    />
  );
}
