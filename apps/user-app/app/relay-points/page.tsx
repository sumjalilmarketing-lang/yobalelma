import { UserAppInfoPage } from "@/apps/user-app/src/components/user-app-info-page";

export const metadata = {
  title: "Points relais | Yobalelma",
};

export default function Page() {
  return (
    <UserAppInfoPage
      eyebrow="Relais"
      title="Points relais"
      description="Les points relais Yobalelma permettent de déposer ou de recevoir un colis dans un cadre simple et sécurisé."
      bullets={[
        "Trouve rapidement un point relais adapté à ta ville.",
        "Reçois des instructions claires pour chaque dépôt.",
        "Suis ton colis à chaque étape de son passage au relais."
      ]}
    />
  );
}
