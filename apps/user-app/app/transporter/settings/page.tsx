import { UserSettingsPage } from "@/apps/user-app/src/components/user-section-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Préférences livreur | Yobalelma" };
export default function Page() { return <UserSettingsPage area="transporter" />; }
