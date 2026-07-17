import type { NextRequest } from "next/server";
import { createBatch } from "@hub-app/src/lib/hub-store";
import { actionError, formString, redirectTo, requestRedirect, requireHubApiSession } from "@hub-app/src/lib/http";
import { tryCreateBatchLive } from "@hub-app/src/lib/live-hub-actions";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub/batches");

  try {
    const session = await requireHubApiSession(request);
    const shipmentIds = formString(formData, "shipmentIds")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const liveBatchId = await tryCreateBatchLive({
      session,
      shipmentIds,
      tripId: formString(formData, "tripId"),
    });

    if (liveBatchId) {
      return requestRedirect(request, `/hub/batches/${liveBatchId}`);
    }

    const batch = createBatch({
      session,
      shipmentIds,
      tripId: formString(formData, "tripId"),
    });

    return requestRedirect(request, `/hub/batches/${batch.id}`);
  } catch (error) {
    return actionError(request, error, returnTo);
  }
}
