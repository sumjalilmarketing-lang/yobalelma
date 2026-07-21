import { UserSettingsPage } from "@/apps/user-app/src/components/user-section-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Préférences client | Yobalelma" };
export default function Page() { return <UserSettingsPage area="client" />; }
