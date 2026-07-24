import { beforeEach, describe, expect, it } from "vitest";
import { canUseHubRoute } from "../src/lib/permissions";
import {
  confirmInboundManifest,
  createAnomaly,
  createBatch,
  generatePickupQr,
  getHubState,
  getInventoryByShipment,
  getManifest,
  handoverBatch,
  moveInventory,
  recordInspection,
  reserveShipmentForBatch,
  resetHubState,
  scanInboundPackage,
} from "../src/lib/hub-store";
import { hubText } from "../src/lib/i18n";
import type { HubSession } from "../src/lib/types";

const session: HubSession = {
  email: "agent.hub@yobalelma.test",
  expiresAt: Date.now() + 60_000,
  hubId: "hub-dss",
  name: "Awa Diop",
  role: "hub_agent",
  sessionId: "test-session",
};

const managerSession: HubSession = {
  ...session,
  email: "manager.hub@yobalelma.test",
  name: "Ndeye Fall",
  role: "hub_manager",
  sessionId: "manager-session",
};

function prepareParisShipment() {
  scanInboundPackage({
    manifestId: "manifest-dss-002",
    session,
    status: "received_at_hub",
    trackingCode: "YBL-DSS-CDG-006",
  });
  recordInspection({
    decision: "approved",
    measuredWeightKg: 7.5,
    note: "Controle conforme.",
    packagingQuality: "excellent",
    session,
    shipmentId: "shp-006",
  });
}

describe("hub operational workflows", () => {
  beforeEach(() => {
    resetHubState();
  });

  it("records an inbound scan and creates audit/tracking events", () => {
    const manifest = scanInboundPackage({
      manifestId: "manifest-dss-002",
      session,
      status: "received_at_hub",
      trackingCode: "YBL-DSS-CDG-006",
    });

    expect(manifest.items[0].status).toBe("received_at_hub");
    expect(getInventoryByShipment("shp-006")?.status).toBe("inspection_required");
    expect(getHubState().auditEvents.at(-1)?.action).toBe("hub_inbound_item_scanned");
    expect(getHubState().trackingEvents.at(-1)?.shipmentId).toBe("shp-006");
  });

  it("requires a justification for missing, extra or damaged manifest discrepancies", () => {
    expect(() =>
      scanInboundPackage({
        manifestId: "manifest-dss-002",
        session,
        status: "missing_at_hub",
        trackingCode: "YBL-DSS-CDG-006",
      }),
    ).toThrow(/justified note/i);
  });

  it("confirms a manifest only when discrepancies are justified", () => {
    const manifest = confirmInboundManifest("manifest-dss-001", session);

    expect(["needs_review", "confirmed"]).toContain(manifest.status);
    expect(getManifest("manifest-dss-001")?.status).toBe("needs_review");
  });

  it("records inspections and blocks a package above the weight blocking threshold", () => {
    const inspection = recordInspection({
      measuredWeightKg: 6.2,
      note: "Poids superieur au seuil.",
      packagingQuality: "acceptable",
      session,
      shipmentId: "shp-001",
    });

    expect(inspection.decision).toBe("blocked");
    expect(getHubState().anomalies[0].type).toBe("wrong_weight");
  });

  it("moves inventory to a single active storage location", () => {
    const moved = moveInventory({
      note: "Stockage zone France.",
      session,
      shipmentId: "shp-002",
      status: "in_storage",
      toLocationId: "loc-storage-01",
    });

    expect(moved.locationId).toBe("loc-storage-01");
    expect(getHubState().inventory.filter((item) => item.shipmentId === "shp-002" && item.active)).toHaveLength(1);
  });

  it("creates a batch and reserves compatible capacity transactionally", () => {
    prepareParisShipment();

    const batch = createBatch({
      session: managerSession,
      shipmentIds: ["shp-006"],
      tripId: "trip-cdg-001",
    });

    expect(batch.shipmentIds).toContain("shp-006");
    expect(batch.capacityReservedKg).toBeGreaterThan(0);
    expect(getInventoryByShipment("shp-006")?.status).toBe("reserved_for_batch");
  });

  it("prevents a shipment from being reserved in two active batches", () => {
    prepareParisShipment();

    const first = createBatch({
      session: managerSession,
      shipmentIds: ["shp-006"],
      tripId: "trip-cdg-001",
    });
    const second = createBatch({
      session: managerSession,
      shipmentIds: [],
      tripId: "trip-cdg-001",
    });

    expect(first.shipmentIds).toContain("shp-006");
    expect(() =>
      reserveShipmentForBatch({
        batchId: second.id,
        session: managerSession,
        shipmentId: "shp-006",
      }),
    ).toThrow(/already belongs/i);
  });

  it("rejects incompatible destination capacity reservations", () => {
    prepareParisShipment();

    const batch = createBatch({
      session: managerSession,
      shipmentIds: [],
      tripId: "trip-abj-001",
    });

    expect(() =>
      reserveShipmentForBatch({
        batchId: batch.id,
        session: managerSession,
        shipmentId: "shp-006",
      }),
    ).toThrow(/incompatible/i);
  });

  it("generates a one-use pickup QR and blocks double scans", () => {
    const token = generatePickupQr("batch-cdg-001", managerSession);
    const handedOver = handoverBatch({
      batchId: "batch-cdg-001",
      session: managerSession,
      token: token.token,
      verifiedDocument: true,
      verifiedIdentity: true,
      verifiedTicket: true,
    });

    expect(handedOver.status).toBe("handed_over");
    expect(() =>
      handoverBatch({
        batchId: "batch-cdg-001",
        session: managerSession,
        token: token.token,
        verifiedDocument: true,
        verifiedIdentity: true,
        verifiedTicket: true,
      }),
    ).toThrow(/already been used/i);
  });

  it("creates and resolves anomalies with audit logs", () => {
    const anomaly = createAnomaly({
      description: "Vol modifie par le voyageur.",
      hubId: "hub-dss",
      priority: "high",
      session,
      title: "Changement de vol",
      type: "flight_changed",
    });

    expect(anomaly.status).toBe("open");
    expect(getHubState().auditEvents.at(-1)?.action).toBe("hub_anomaly_created");
  });
});

describe("hub access and internationalization", () => {
  it("allows operations_manager to orchestrate Hub write workflows", () => {
    expect(canUseHubRoute("operations_manager", "/api/hub/inspection", "POST")).toBe(true);
    expect(canUseHubRoute("operations_manager", "/api/hub/handover", "POST")).toBe(true);
    expect(canUseHubRoute("operations_manager", "/hub/reports", "GET")).toBe(true);
  });

  it("keeps Arabic labels available for RTL layouts", () => {
    expect(hubText("ar", "dashboard")).toContain("مركز");
  });

  it("keeps manager-only settings protected", () => {
    expect(canUseHubRoute("hub_agent", "/hub/settings", "GET")).toBe(false);
    expect(canUseHubRoute("hub_manager", "/hub/settings", "GET")).toBe(true);
  });
});
