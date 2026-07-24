import { NextResponse } from "next/server";
import { geoPointSchema } from "@/lib/geolocation/provider";
import { createServerMapProvider } from "@/lib/geolocation/server-provider";
import { assertLocationRateLimit } from "@/lib/geolocation/security";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try { assertLocationRateLimit(request, 20); const supabase = await tryCreateSupabaseServerClient(); const user = supabase ? (await supabase.auth.getUser()).data.user : null; if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 }); const point = geoPointSchema.parse(await request.json()); return NextResponse.json({ address: await createServerMapProvider().reverseGeocode(point) }, { headers: { "cache-control": "private, max-age=60" } }); }
  catch (error) { const code = error instanceof Error ? error.message : "REVERSE_GEOCODING_FAILED"; return NextResponse.json({ error: code === "MAP_PROVIDER_ACCESS_REQUIRED" ? "Le service cartographique n’est pas encore activé." : "La position n’a pas pu être reconnue." }, { status: code === "MAP_PROVIDER_ACCESS_REQUIRED" ? 503 : 400 }); }
}
