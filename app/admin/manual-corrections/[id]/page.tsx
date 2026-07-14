import { redirect } from "next/navigation";

export default async function AdminManualCorrectionAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  redirect(`/dashboard/admin/manual-corrections/${id}`);
}
