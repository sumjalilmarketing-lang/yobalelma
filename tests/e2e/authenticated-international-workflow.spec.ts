import { expect, test } from "playwright/test";
import {
  createAdminClient,
  dateFromToday,
  ensureE2EUser,
  loginAs,
  requireSupabaseAuthenticatedE2E,
  type E2EUser,
} from "./authenticated-helpers";

type ApiResult<T = unknown> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

type ApiCall<T> = {
  body: ApiResult<T>;
  status: number;
};

type ShipmentApiData = {
  estimate: { scope: "national" | "international" };
  shipmentId: string;
  trackingCode: string;
};

type ScanQrData = {
  result: {
    batch_id: string;
    next_token: string | null;
    next_token_expires_at: string | null;
  } | null;
};

function requireOk<T>(result: ApiCall<T>): asserts result is {
  body: { ok: true; message: string; data: T };
  status: number;
} {
  if (result.status < 200 || result.status >= 400 || !result.body.ok) {
    throw new Error(`API failed with status ${result.status}: ${JSON.stringify(result.body)}`);
  }
}

async function postJson<T>(page: Parameters<typeof loginAs>[0], path: string, payload: unknown) {
  return page.evaluate(
    async ({ path: requestPath, payload: requestPayload }) => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20_000);

      try {
        const response = await fetch(requestPath, {
          body: JSON.stringify(requestPayload),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });
        const body = (await response.json()) as ApiResult<T>;

        return {
          body,
          status: response.status,
        };
      } catch (error) {
        return {
          body: {
            ok: false,
            message:
              error instanceof Error
                ? `API request failed for ${requestPath}: ${error.message}`
                : `API request failed for ${requestPath}.`,
          },
          status: 0,
        };
      } finally {
        window.clearTimeout(timeout);
      }
    },
    { path, payload },
  ) as Promise<ApiCall<T>>;
}

async function expectShipmentStatus(shipmentId: string, expectedStatus: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shipments")
    .select("status")
    .eq("id", shipmentId)
    .single();

  expect(error).toBeNull();
  expect(data?.status).toBe(expectedStatus);
}

async function expectBatchStatus(batchId: string, expectedStatus: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("hub_batches")
    .select("status")
    .eq("id", batchId)
    .single();

  expect(error).toBeNull();
  expect(data?.status).toBe(expectedStatus);
}

async function getSeedHubIds() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("airport_hubs")
    .select("id, code")
    .in("code", ["CDG-PARIS", "DSS-DAKAR"]);

  expect(error).toBeNull();

  const originHubId = data?.find((hub) => hub.code === "CDG-PARIS")?.id;
  const destinationHubId = data?.find((hub) => hub.code === "DSS-DAKAR")?.id;

  expect(originHubId).toBeTruthy();
  expect(destinationHubId).toBeTruthy();

  return {
    destinationHubId: destinationHubId as string,
    originHubId: originHubId as string,
  };
}

function workflowCode(prefix: "HUB" | "MAN") {
  const suffix = Date.now().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${prefix}-${suffix.slice(0, 10).padEnd(6, "X")}`;
}

test.describe.serial("authenticated international shipment workflow", () => {
  test.setTimeout(180_000);

  test.beforeEach(() => {
    requireSupabaseAuthenticatedE2E();
  });

  test("runs relay dropoff, hub batching and destination QR delivery", async ({ page }) => {
    const [client, relayAgent, operations, traveler] = await Promise.all([
      ensureE2EUser("client", "international"),
      ensureE2EUser("relay_agent", "international"),
      ensureE2EUser("operations_manager", "international"),
      ensureE2EUser("traveler", "international"),
    ]);
    const { originHubId } = await getSeedHubIds();
    const runId = Date.now().toString(36);

    await loginAs(page, client, "/dashboard/client/shipments/new");
    await page.waitForURL((url) => url.pathname === "/dashboard/client/shipments/new");

    const shipment = await postJson<ShipmentApiData>(page, "/api/shipments", {
      confirmationAccepted: true,
      declaredValueCents: 8500,
      deliveryAddressLine1: "12 route de Ouakam",
      deliveryCity: "Dakar",
      deliveryCountry: "Senegal",
      deliveryInstructions: "Remise contre QR destination.",
      deliveryPostalCode: "12500",
      fragile: false,
      fulfillmentMethod: "relay_dropoff",
      heightCm: 8,
      latestDeliveryDate: dateFromToday(14),
      lengthCm: 28,
      packageCategory: "documents",
      packageDescription: "Documents de test E2E pour le parcours international complet.",
      packageTitle: `Documents international ${runId}`,
      pickupAddressLine1: "1 rue du Test",
      pickupCity: "Paris",
      pickupCountry: "France",
      pickupInstructions: "Depot au relais E2E.",
      pickupPostalCode: "75001",
      preferredPickupDate: dateFromToday(3),
      prohibitedItemsConfirmed: true,
      recipientEmail: `dest.${runId}@yobalelma.test`,
      recipientName: "Destinataire International",
      recipientPhone: "+221770000000",
      senderEmail: client.email,
      senderName: "Client International",
      senderPhone: "+33100000000",
      serviceLevel: "standard",
      weightKg: 1.4,
      widthCm: 20,
    });
    requireOk(shipment);
    expect(shipment.body.data.estimate.scope).toBe("international");
    await expectShipmentStatus(shipment.body.data.shipmentId, "confirmed");

    const trip = await createTravelerTrip(page, traveler);
    const document = await postJson<{ documentId: string }>(page, "/api/travel-documents", {
      arrivalAirport: "DSS",
      arrivalDate: dateFromToday(9),
      departureAirport: "CDG",
      departureDate: dateFromToday(8),
      documentNumber: `E2E-${runId}`,
      filePath: `travel/e2e/${runId}/ticket.pdf`,
      issuingCountry: "France",
      travelerName: "Codex Traveler",
      tripId: trip.tripId,
    });
    requireOk(document);
    expect(document.body.data.documentId).toBeTruthy();

    await loginAs(page, relayAgent, "/dashboard/relay");
    await page.waitForURL((url) => url.pathname === "/dashboard/relay");

    const relayPoint = await postJson<{ relayPointId: string }>(page, "/api/relay/points", {
      addressLine1: "18 avenue des Tests",
      capacitySlots: 100,
      city: "Paris",
      contactName: "Relais E2E",
      contactPhone: "+33101010101",
      country: "France",
      name: `Relais international ${runId}`,
      postalCode: "75010",
    });
    requireOk(relayPoint);

    const checkIn = await postJson<{ scanId: string }>(page, "/api/relay/scans", {
      note: "Depot client au relais origine.",
      relayPointId: relayPoint.body.data.relayPointId,
      scanType: "check_in",
      trackingCode: shipment.body.data.trackingCode,
    });
    requireOk(checkIn);
    await expectShipmentStatus(shipment.body.data.shipmentId, "at_relay");

    await loginAs(page, operations, "/dashboard/operations");
    await page.waitForURL((url) => url.pathname === "/dashboard/operations");

    const route = await postJson<{ routeId: string }>(page, "/api/collection/routes", {
      name: `Collecte relais ${runId}`,
      routeDate: dateFromToday(4),
    });
    requireOk(route);

    const stop = await postJson<{ stopId: string }>(
      page,
      `/api/collection/routes/${route.body.data.routeId}`,
      {
        relayPointId: relayPoint.body.data.relayPointId,
        stopOrder: 1,
      },
    );
    requireOk(stop);

    const manifest = await postJson<{ manifestId: string }>(page, "/api/collection/manifests", {
      code: workflowCode("MAN"),
      routeId: route.body.data.routeId,
    });
    requireOk(manifest);

    const manifestItem = await postJson<{ itemId: string }>(page, "/api/collection/manifests", {
      manifestId: manifest.body.data.manifestId,
      mode: "item",
      shipmentId: shipment.body.data.shipmentId,
    });
    requireOk(manifestItem);
    await expectShipmentStatus(shipment.body.data.shipmentId, "collected_for_hub");

    await loginAs(page, relayAgent, "/dashboard/relay");
    await page.waitForURL((url) => url.pathname === "/dashboard/relay");

    const checkOut = await postJson<{ scanId: string }>(page, "/api/relay/scans", {
      note: "Sortie relais vers collecte hub.",
      relayPointId: relayPoint.body.data.relayPointId,
      scanType: "check_out",
      trackingCode: shipment.body.data.trackingCode,
    });
    requireOk(checkOut);
    await expectShipmentStatus(shipment.body.data.shipmentId, "collected_for_hub");

    await loginAs(page, operations, "/dashboard/operations");
    await page.waitForURL((url) => url.pathname === "/dashboard/operations");

    const inbound = await postJson<{ receiptId: string }>(page, "/api/hub/inbound", {
      hubId: originHubId,
      items: [
        {
          shipmentId: shipment.body.data.shipmentId,
          status: "received_at_hub",
          trackingCode: shipment.body.data.trackingCode,
        },
      ],
      manifestId: manifest.body.data.manifestId,
      notes: "Reception hub origine E2E.",
    });
    requireOk(inbound);
    expect(inbound.body.data.receiptId).toBeTruthy();
    await expectShipmentStatus(shipment.body.data.shipmentId, "at_hub");

    const inspection = await postJson<{ inspectionId: string }>(page, "/api/hub/advanced-inspections", {
      decision: "approved",
      declaredWeightKg: 1.4,
      hubId: originHubId,
      measuredWeightKg: 1.4,
      packageCondition: "conforme",
      packagingCompliant: true,
      shipmentId: shipment.body.data.shipmentId,
    });
    requireOk(inspection);
    expect(inspection.body.data.inspectionId).toBeTruthy();

    const batch = await postJson<{ batchId: string }>(page, "/api/hub/batches", {
      capacityKg: 30,
      code: workflowCode("HUB"),
      departureDate: dateFromToday(8),
      destinationCity: "Dakar",
      destinationCountry: "Senegal",
      destinationHub: "Dakar DSS Hub",
      flightNumber: `AF${runId.slice(-4).toUpperCase()}`,
      hubId: originHubId,
      originHub: "Paris CDG Hub",
      travelerId: traveler.id,
      tripId: trip.tripId,
    });
    requireOk(batch);

    const reservation = await postJson<{ reservationId: string }>(page, "/api/hub/assignments", {
      batchId: batch.body.data.batchId,
      reservedWeightKg: 1.4,
      shipmentId: shipment.body.data.shipmentId,
    });
    requireOk(reservation);
    expect(reservation.body.data.reservationId).toBeTruthy();

    const originQr = await postJson<{
      qrPayload: string;
      tokenId: string;
      tokenType: "origin_pickup";
    }>(page, "/api/qr/handover", {
      batchId: batch.body.data.batchId,
      expiresInMinutes: 30,
      tokenType: "origin_pickup",
    });
    requireOk(originQr);
    expect(originQr.body.data.qrPayload).toContain("yobalelma");

    const originScan = await postJson<ScanQrData>(page, "/api/qr/scan", {
      expectedTokenType: "origin_pickup",
      note: "Remise au voyageur E2E.",
      token: originQr.body.data.qrPayload,
    });
    requireOk(originScan);
    expect(originScan.body.data.result?.next_token).toBeTruthy();
    await expectShipmentStatus(shipment.body.data.shipmentId, "in_transit");
    await expectBatchStatus(batch.body.data.batchId, "in_transit");

    const destinationScan = await postJson<ScanQrData>(page, "/api/qr/scan", {
      expectedTokenType: "destination_dropoff",
      note: "Depot destination E2E.",
      token: originScan.body.data.result?.next_token,
    });
    requireOk(destinationScan);
    await expectShipmentStatus(shipment.body.data.shipmentId, "delivered");
    await expectBatchStatus(batch.body.data.batchId, "closed");
  });
});

async function createTravelerTrip(page: Parameters<typeof loginAs>[0], traveler: E2EUser) {
  await loginAs(page, traveler, "/dashboard/traveler/trips/new");
  await page.waitForURL((url) => url.pathname === "/dashboard/traveler/trips/new");

  const trip = await postJson<{ tripId: string }>(page, "/api/trips", {
    arrivalDate: dateFromToday(9),
    availableWeightKg: 10,
    departureDate: dateFromToday(8),
    destinationCity: "Dakar",
    destinationCountry: "Senegal",
    notes: "Voyage E2E sans colis reel.",
    originCity: "Paris",
    originCountry: "France",
  });

  requireOk(trip);
  expect(trip.body.data.tripId).toBeTruthy();

  return trip.body.data;
}
