import type { NextRequest } from "next/server";
import { createAnomaly, resolveAnomaly } from "@hub-app/src/lib/hub-store";
import { actionError, formString, redirectTo, requestRedirect, requireHubApiSession } from "@hub-app/src/lib/http";
import { canUseHubFixture, tryCreateAnomalyLive, tryResolveAnomalyLive } from "@hub-app/src/lib/live-hub-actions";
import type { AnomalyType, Priority } from "@hub-app/src/lib/types";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub/anomalies");

  try {
    const session = await requireHubApiSession(request);

    if (formString(formData, "intent") === "resolve") {
      const resolved = await tryResolveAnomalyLive(formString(formData, "id"), session);
      if (!resolved && canUseHubFixture(session)) resolveAnomaly(formString(formData, "id"), session);
      else if (!resolved) throw new Error("L’incident n’a pas été résolu.");
    } else {
      const input = {
        description: formString(formData, "description"),
        hubId: session.hubId,
        priority: formString(formData, "priority", "medium") as Priority,
        session,
        title: formString(formData, "title"),
        type: formString(formData, "type", "manual_review") as AnomalyType,
      };

      const created = await tryCreateAnomalyLive(input);
      if (!created && canUseHubFixture(session)) {
        createAnomaly(input);
      } else if (!created) {
        throw new Error("L’incident n’a pas été créé.");
      }
    }

    return requestRedirect(request, returnTo);
  } catch (error) {
    return actionError(request, error, returnTo);
  }
}
