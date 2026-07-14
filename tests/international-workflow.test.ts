import { describe, expect, it } from "vitest";
import {
  actionsForInternationalWorkspace,
  internationalWorkflowSteps,
  stepProgressForStatus,
  workspaceForRole,
} from "@/lib/international/status-machine";

describe("international workflow status machine", () => {
  it("covers the full client to destination relay chain", () => {
    expect(internationalWorkflowSteps.map((step) => step.id)).toEqual([
      "shipment_created",
      "pickup_requested",
      "local_transporter_assigned",
      "picked_up_from_sender",
      "received_at_origin_relay",
      "stored_at_origin_relay",
      "ready_for_collection",
      "loaded_from_relay",
      "in_transit_to_hub",
      "received_at_hub",
      "inspected_at_hub",
      "stored_at_hub",
      "traveler_trip_validated",
      "traveler_capacity_declared",
      "assigned_to_batch",
      "batch_ready",
      "pickup_qr_generated",
      "handed_to_traveler",
      "destination_qr_generated",
      "received_at_destination_relay",
      "ready_for_final_delivery",
      "delivered",
      "incident_opened",
      "incident_resolved",
    ]);
  });

  it("maps platform roles to the correct operational workspace", () => {
    expect(workspaceForRole("client")).toBe("client");
    expect(workspaceForRole("local_transporter")).toBe("transporter");
    expect(workspaceForRole("relay_agent")).toBe("relay");
    expect(workspaceForRole("collection_driver")).toBe("collection");
    expect(workspaceForRole("hub_manager")).toBe("hub");
    expect(workspaceForRole("traveler")).toBe("traveler");
    expect(workspaceForRole("super_admin")).toBe("admin");
  });

  it("exposes actionable routes for every operational workspace", () => {
    const workspaces = ["client", "transporter", "relay", "collection", "hub", "traveler", "admin"] as const;

    for (const workspace of workspaces) {
      const actions = actionsForInternationalWorkspace(workspace);

      expect(actions.length).toBeGreaterThanOrEqual(3);
      expect(actions.every((action) => action.href.startsWith("/dashboard/"))).toBe(true);
    }
  });

  it("computes progress from real shipment statuses", () => {
    expect(stepProgressForStatus("confirmed").completed).toBeGreaterThan(0);
    expect(stepProgressForStatus("at_relay").currentStep.owner).toBe("relay");
    expect(stepProgressForStatus("collected_for_hub").currentStep.owner).toBe("collection");
    expect(stepProgressForStatus("at_hub").currentStep.owner).toBe("hub");
    expect(stepProgressForStatus("in_transit").currentStep.owner).toBe("traveler");
    expect(stepProgressForStatus("delivered").nextStep).not.toBeNull();
  });
});
