import { AdminFinalDeliveryPage } from "@/components/final-delivery/admin-final-delivery-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Revue payout | Yobalelma",
};

export default async function AdminPayoutReviewPage() {
  return (
    <AdminFinalDeliveryPage
      focus="payouts"
      title="Revue payout"
      description="Eligibilite voyageur et livreur final, blocages et provider sandbox/manual."
    />
  );
}
