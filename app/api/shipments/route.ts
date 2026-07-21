import { fail, ok, parseJsonRequest } from "@/lib/api/responses";
import { shouldExposeTestOtp } from "@/lib/final-delivery/otp-visibility";
import {
  buildDigitalParcelTwin,
  estimateShipment,
} from "@/lib/shipments/estimation";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { shipmentSchema } from "@/lib/validation/shipment";

export async function GET() {
  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour consulter tes expéditions.", 401);
  }

  const { data, error } = await supabase
    .from("shipments")
    .select("id, tracking_code, origin_city, destination_city, estimated_price_cents, currency, status")
    .eq("sender_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return fail(error.message, 400);
  }

  return ok("Expéditions chargées.", {
    shipments: (data ?? []).map((shipment) => ({
      id: shipment.id,
      label: `${shipment.tracking_code} · ${shipment.origin_city} → ${shipment.destination_city}`,
      amountCents: shipment.estimated_price_cents,
      currency: shipment.currency,
      status: shipment.status,
    })),
  });
}

export async function POST(request: Request) {
  const parsed = await parseJsonRequest(request, shipmentSchema);

  if (!parsed.ok) {
    return parsed.response;
  }

  const supabase = await tryCreateSupabaseServerClient();

  if (!supabase) {
    return fail("Le service Yobalelma n'est pas encore disponible.", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Connecte-toi pour creer une expedition.", 401);
  }

  if (
    parsed.data.packagePhotoPath &&
    !parsed.data.packagePhotoPath.startsWith(`${user.id}/`)
  ) {
    return fail("Cette photo ne peut pas être rattachée à ton envoi.", 403);
  }

  const estimate = estimateShipment(parsed.data);
  const digitalTwin = buildDigitalParcelTwin(parsed.data, estimate);
  const { data, error } = await supabase.rpc("create_operational_shipment", {
    p_currency: estimate.currency,
    p_delivery_address: {
      address_line1: parsed.data.deliveryAddressLine1,
      address_line2: parsed.data.deliveryAddressLine2 || null,
      city: parsed.data.deliveryCity,
      contact_email: parsed.data.recipientEmail || null,
      contact_name: parsed.data.recipientName,
      contact_phone: parsed.data.recipientPhone,
      country: parsed.data.deliveryCountry,
      instructions: parsed.data.deliveryInstructions || null,
      postal_code: parsed.data.deliveryPostalCode || null,
    },
    p_destination_city: parsed.data.deliveryCity,
    p_destination_country: parsed.data.deliveryCountry,
    p_digital_twin: digitalTwin,
    p_estimated_price_cents: estimate.priceCents,
    p_eta_max_days: estimate.etaMaxDays,
    p_eta_min_days: estimate.etaMinDays,
    p_latest_delivery_date: parsed.data.latestDeliveryDate,
    p_origin_city: parsed.data.pickupCity,
    p_origin_country: parsed.data.pickupCountry,
    p_package: {
      category: parsed.data.packageCategory,
      declared_value_cents: parsed.data.declaredValueCents,
      description: parsed.data.packageDescription,
      fragile: parsed.data.fragile,
      height_cm: parsed.data.heightCm,
      length_cm: parsed.data.lengthCm,
      prohibited_items_confirmed: parsed.data.prohibitedItemsConfirmed,
      title: parsed.data.packageTitle,
      weight_kg: parsed.data.weightKg,
      width_cm: parsed.data.widthCm,
    },
    p_fulfillment_method: parsed.data.fulfillmentMethod,
    p_package_photo_path: parsed.data.packagePhotoPath || undefined,
    p_pickup_address: {
      address_line1: parsed.data.pickupAddressLine1,
      address_line2: parsed.data.pickupAddressLine2 || null,
      city: parsed.data.pickupCity,
      contact_email: parsed.data.senderEmail || user.email || null,
      contact_name: parsed.data.senderName,
      contact_phone: parsed.data.senderPhone,
      country: parsed.data.pickupCountry,
      instructions: parsed.data.pickupInstructions || null,
      postal_code: parsed.data.pickupPostalCode || null,
    },
    p_preferred_pickup_date: parsed.data.preferredPickupDate,
    p_scope: estimate.scope,
    p_service_level: parsed.data.serviceLevel,
  });

  if (error) {
    return fail(error.message, 400);
  }

  const shipment = data?.[0];

  if (!shipment) {
    return fail("Expedition creee sans reference de suivi.", 500);
  }

  return ok("Expedition creee et confirmee.", {
    deliveryOtpCodeForTestOnly: shouldExposeTestOtp() ? shipment.delivery_otp_code : undefined,
    estimate,
    shipmentId: shipment.id,
    trackingCode: shipment.tracking_code,
  });
}
