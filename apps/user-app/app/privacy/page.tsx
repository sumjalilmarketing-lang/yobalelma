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
        "Tracking public sans adresse complete ni donnees KYC.",
        "Acces prive limite au bon compte.",
        "Informations sensibles protegees."
]}
    />
  );
}
