import { AdminFinalDeliveryPage } from "@/components/final-delivery/admin-final-delivery-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Audit logs livraison | Yobalelma",
};

export default async function AdminAuditLogsPage() {
  return (
    <AdminFinalDeliveryPage
      focus="audit"
      title="Audit logs livraison finale"
      description="Vue consolidee corrections, OTP, preuves, payouts et evenements de destination finale."
    />
  );
}
