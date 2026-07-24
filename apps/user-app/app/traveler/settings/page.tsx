import { UserSettingsPage } from "@/apps/user-app/src/components/user-section-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Préférences voyageur | Yobalelma" };
export default function Page() { return <UserSettingsPage area="traveler" />; }
