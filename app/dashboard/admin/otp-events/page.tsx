import { AdminFinalDeliveryPage } from "@/components/final-delivery/admin-final-delivery-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "OTP events | Yobalelma",
};

export default async function AdminOtpEventsPage() {
  return (
    <AdminFinalDeliveryPage
      focus="otp"
      title="OTP events"
      description="OTP actifs, expires, bloques, renvois et tentatives visibles par l'administration."
    />
  );
}
