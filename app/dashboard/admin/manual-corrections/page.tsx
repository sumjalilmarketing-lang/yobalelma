import { AdminFinalDeliveryPage } from "@/components/final-delivery/admin-final-delivery-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Corrections manuelles | Yobalelma",
};

export default async function AdminManualCorrectionsPage() {
  return (
    <AdminFinalDeliveryPage
      focus="corrections"
      title="Corrections manuelles"
      description="Toutes les corrections sensibles de livraison finale avec permission, motif et commentaire."
    />
  );
}
