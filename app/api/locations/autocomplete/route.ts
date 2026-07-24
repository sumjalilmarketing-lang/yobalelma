import { NextResponse } from "next/server";
import { addressSearchSchema, rankAddressSuggestions } from "@/lib/geolocation/provider";
import { createServerMapProvider } from "@/lib/geolocation/server-provider";
import { assertLocationRateLimit } from "@/lib/geolocation/security";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    assertLocationRateLimit(request); const supabase = await tryCreateSupabaseServerClient(); const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    const input = addressSearchSchema.parse(await request.json()); const suggestions = await createServerMapProvider().autocomplete(input);
    return NextResponse.json({ suggestions: rankAddressSuggestions(suggestions, input) }, { headers: { "cache-control": "private, max-age=60" } });
  } catch (error) { const code = error instanceof Error ? error.message : "LOCATION_SEARCH_FAILED"; const status = code === "LOCATION_RATE_LIMITED" ? 429 : code === "MAP_PROVIDER_ACCESS_REQUIRED" ? 503 : 400; return NextResponse.json({ error: status === 503 ? "La recherche d’adresse sera disponible dès l’activation du service cartographique." : status === 429 ? "Trop de recherches. Réessayez dans un instant." : "L’adresse n’a pas pu être recherchée." }, { status }); }
}
