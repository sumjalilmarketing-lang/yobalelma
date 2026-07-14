import { UserAppInfoPage } from "@/apps/user-app/src/components/user-app-info-page";

export const metadata = {
  title: "Securite et confiance | Yobalelma",
};

export default function Page() {
  return (
    <UserAppInfoPage
      eyebrow="Confiance"
      title="Securite et confiance"
      description="Les roles, la verification KYC et les preuves protegent les donnees et les colis."
      bullets={[
        "Routes protegees par session utilisateur.",
        "Donnees privees masquees du tracking public.",
        "Documents et preuves rattaches aux permissions."
]}
    />
  );
}
