import type { NextRequest } from "next/server";
import { createAnomaly, resolveAnomaly } from "@hub-app/src/lib/hub-store";
import { actionError, formString, redirectTo, requestRedirect, requireHubApiSession } from "@hub-app/src/lib/http";
import { tryCreateAnomalyLive } from "@hub-app/src/lib/live-hub-actions";
import type { AnomalyType, Priority } from "@hub-app/src/lib/types";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub/anomalies");

  try {
    const session = await requireHubApiSession(request);

    if (formString(formData, "intent") === "resolve") {
      resolveAnomaly(formString(formData, "id"), session);
    } else {
      const input = {
        description: formString(formData, "description"),
        hubId: session.hubId,
        priority: formString(formData, "priority", "medium") as Priority,
        session,
        title: formString(formData, "title"),
        type: formString(formData, "type", "manual_review") as AnomalyType,
      };

      if (!(await tryCreateAnomalyLive(input))) {
        createAnomaly(input);
      }
    }

    return requestRedirect(request, returnTo);
  } catch (error) {
    return actionError(request, error, returnTo);
  }
}
