import { AdminFinalDeliveryPage } from "@/components/final-delivery/admin-final-delivery-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Detail correction | Yobalelma",
};

export default async function AdminManualCorrectionDetailPage() {
  return (
    <AdminFinalDeliveryPage
      focus="corrections"
      title="Detail correction manuelle"
      description="Lecture auditee des corrections manuelles de livraison finale."
    />
  );
}
