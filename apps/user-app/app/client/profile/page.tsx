import { UserProfilePage } from "@/apps/user-app/src/components/user-profile-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profil client | Yobalelma",
};

export default function Page() {
  return <UserProfilePage role="client" />;
}
