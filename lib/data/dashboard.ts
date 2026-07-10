import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardState =
  | { status: "needs-env" }
  | { status: "signed-out" }
  | {
      status: "ready";
      userEmail: string;
      parcelCount: number;
      tripCount: number;
      offerCount: number;
      recentParcels: Array<{
        id: string;
        origin_city: string;
        destination_city: string;
        status: string;
        created_at: string;
      }>;
      recentTrips: Array<{
        id: string;
        origin_city: string;
        destination_city: string;
        status: string;
        departure_date: string;
      }>;
    };

export async function getDashboardState(): Promise<DashboardState> {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return { status: "needs-env" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "signed-out" };
  }

  const [parcelResult, tripResult, offerResult] = await Promise.all([
    supabase
      .from("parcel_requests")
      .select("id, origin_city, destination_city, status, created_at")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("trips")
      .select("id, origin_city, destination_city, status, departure_date")
      .eq("traveler_id", user.id)
      .order("departure_date", { ascending: true })
      .limit(5),
    supabase
      .from("offers")
      .select("id", { count: "exact", head: true })
      .eq("traveler_id", user.id),
  ]);

  return {
    status: "ready",
    userEmail: user.email ?? "Compte Yobalelma",
    parcelCount: parcelResult.data?.length ?? 0,
    tripCount: tripResult.data?.length ?? 0,
    offerCount: offerResult.count ?? 0,
    recentParcels: parcelResult.data ?? [],
    recentTrips: tripResult.data ?? [],
  };
}
