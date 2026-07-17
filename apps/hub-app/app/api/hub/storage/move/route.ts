import type { NextRequest } from "next/server";
import { moveInventory } from "@hub-app/src/lib/hub-store";
import { actionError, formNumber, formString, redirectTo, requestRedirect, requireHubApiSession } from "@hub-app/src/lib/http";
import { tryMoveInventoryLive } from "@hub-app/src/lib/live-hub-actions";
import type { InventoryStatus } from "@hub-app/src/lib/types";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub/inventory");

  try {
    const session = await requireHubApiSession(request);
    const input = {
      measuredWeightKg: formNumber(formData, "measuredWeightKg", 0) || undefined,
      note: formString(formData, "note"),
      session,
      shipmentId: formString(formData, "shipmentId"),
      status: formString(formData, "status", "in_storage") as InventoryStatus,
      toLocationId: formString(formData, "toLocationId"),
    };

    if (!(await tryMoveInventoryLive(input))) {
      moveInventory(input);
    }

    return requestRedirect(request, returnTo);
  } catch (error) {
    return actionError(request, error, returnTo);
  }
}
