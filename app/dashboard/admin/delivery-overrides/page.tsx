import { AdminFinalDeliveryPage } from "@/components/final-delivery/admin-final-delivery-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Overrides livraison | Yobalelma",
};

export default async function AdminDeliveryOverridesPage() {
  return (
    <AdminFinalDeliveryPage
      focus="overrides"
      title="Overrides livraison"
      description="Overrides de statut, preuve alternative et livraison manuelle avec audit obligatoire."
    />
  );
}
