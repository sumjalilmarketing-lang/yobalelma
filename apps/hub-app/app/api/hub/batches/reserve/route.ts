import type { NextRequest } from "next/server";
import { reserveShipmentForBatch } from "@hub-app/src/lib/hub-store";
import { actionError, formString, redirectTo, requestRedirect, requireHubApiSession } from "@hub-app/src/lib/http";
import { tryReserveShipmentForBatchLive } from "@hub-app/src/lib/live-hub-actions";

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

    if (!(await tryReserveShipmentForBatchLive(input))) {
      reserveShipmentForBatch(input);
    }

    return requestRedirect(request, returnTo);
  } catch (error) {
    return actionError(request, error, returnTo);
  }
}
