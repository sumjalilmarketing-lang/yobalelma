import type { NextRequest } from "next/server";
import { reserveShipmentForBatch } from "@hub-app/src/lib/hub-store";
import { actionError, formString, redirectTo, requestRedirect, requireHubApiSession } from "@hub-app/src/lib/http";
import { canUseHubFixture, tryReserveShipmentForBatchLive } from "@hub-app/src/lib/live-hub-actions";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub/batches");

  try {
    const session = await requireHubApiSession(request);
    const input = {
      batchId: formString(formData, "batchId"),
      session,
      shipmentId: formString(formData, "shipmentId"),
    };

    const reserved = await tryReserveShipmentForBatchLive(input);
    if (!reserved && canUseHubFixture(session)) {
      reserveShipmentForBatch(input);
    } else if (!reserved) {
      throw new Error("La réservation n’a pas été confirmée.");
    }

    return requestRedirect(request, returnTo);
  } catch (error) {
    return actionError(request, error, returnTo);
  }
}
