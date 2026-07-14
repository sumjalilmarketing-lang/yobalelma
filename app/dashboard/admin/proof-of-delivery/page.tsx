import { AdminFinalDeliveryPage } from "@/components/final-delivery/admin-final-delivery-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Proof of delivery | Yobalelma",
};

export default async function AdminProofOfDeliveryPage() {
  return (
    <AdminFinalDeliveryPage
      focus="proofs"
      title="Proof of delivery"
      description="Preuves de remise et syntheses autorisees, sans exposer les pieces privees au client."
    />
  );
}
