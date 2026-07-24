import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { buildLogisticsPassportPdf } from "@/lib/traceability/passport-pdf";
import { requireAdminSession } from "@admin-app/src/lib/auth";
import { canInvestigateParcels, loadParcelPassport } from "@admin-app/src/lib/parcel-passport-data";
import { rateLimit } from "@admin-app/src/lib/security";

export async function GET(request: NextRequest) {
  try {
    rateLimit(request, 12, 60_000);
    const session = await requireAdminSession("/command/passports");
    if (!canInvestigateParcels(session)) return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
    const reference = request.nextUrl.searchParams.get("query")?.trim();
    if (!reference || reference.length > 80) return NextResponse.json({ message: "Référence invalide." }, { status: 400 });
    const passport = await loadParcelPassport(session, reference);
    const parcel = passport?.parcel;
    const parcelId = value(parcel?.id);
    if (!passport || !parcel || !parcelId) return NextResponse.json({ message: "Passeport introuvable." }, { status: 404 });
    const supabase = await tryCreateSupabaseServerClient();
    if (!supabase) return NextResponse.json({ message: "Service indisponible." }, { status: 503 });
    const client = supabase as SupabaseClient;
    const verificationId = crypto.randomUUID();
    const generatedAt = new Date().toISOString();
    const trackingCode = value(passport.shipment.tracking_code);
    const pdf = buildLogisticsPassportPdf({
      verificationId,
      generatedAt,
      trackingCode,
      status: value(passport.shipment.status),
      sections: [
        { title: "Identité et itinéraire", rows: [
          ["Identifiant colis", parcelId], ["Origine", `${value(passport.shipment.origin_city)}, ${value(passport.shipment.origin_country)}`],
          ["Destination", `${value(passport.shipment.destination_city)}, ${value(passport.shipment.destination_country)}`], ["Catégorie", value(parcel.category)],
        ] },
        { title: "Chaîne de possession", rows: passport.events.flatMap((event) => [[`Événement #${value(event.sequence_no)}`, `${value(event.event_type)} | ${value(event.stage_before)} -> ${value(event.stage_after)} | ${value(event.occurred_at)} | hash ${value(event.event_hash)}`] as [string, string]]) },
        { title: "Preuves vérifiées", rows: passport.proofs.map((proof) => [value(proof.proof_type), `${value(proof.verification_status)} | ${value(proof.captured_at)}`]) },
        { title: "Scellés", rows: passport.seals.map((seal) => [value(seal.id), `${value(seal.status)} | ${value(seal.applied_at)}`]) },
        { title: "Anomalies", rows: passport.anomalies.map((anomaly) => [value(anomaly.anomaly_type), `${value(anomaly.severity)} | ${value(anomaly.status)}`]) },
      ],
    });
    const storagePath = `${session.userId}/${parcelId}/${verificationId}.pdf`;
    const { error: uploadError } = await client.storage.from("traceability-exports").upload(storagePath, pdf, { contentType: "application/pdf", upsert: false });
    if (uploadError) throw uploadError;
    const { error: logError } = await client.rpc("log_parcel_passport_access", { p_access_type: "export", p_parcel_id: parcelId, p_purpose: `PDF ${verificationId}` });
    if (logError) { await client.storage.from("traceability-exports").remove([storagePath]); throw logError; }
    const expiresIn = 300;
    const { data: signed, error: signedError } = await client.storage.from("traceability-exports").createSignedUrl(storagePath, expiresIn, { download: `passeport-${trackingCode}.pdf` });
    if (signedError || !signed?.signedUrl) throw signedError ?? new Error("Signed URL unavailable");
    return NextResponse.json({ url: signed.signedUrl, verificationId, expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "L’export sécurisé n’a pas pu être généré." }, { status: 503 });
  }
}

function value(input: unknown) { return input === null || input === undefined ? "" : String(input); }
