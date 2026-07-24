import type { NextRequest } from "next/server";
import { recordInspection } from "@hub-app/src/lib/hub-store";
import { actionError, formNumber, formString, redirectTo, requestRedirect, requireHubApiSession } from "@hub-app/src/lib/http";
import { canUseHubFixture, tryRecordInspectionLive } from "@hub-app/src/lib/live-hub-actions";
import type { InspectionDecision, Inspection } from "@hub-app/src/lib/types";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub/inspection");

  try {
    const session = await requireHubApiSession(request);
    const input = {
      decision: formString(formData, "decision") as InspectionDecision,
      measuredWeightKg: formNumber(formData, "measuredWeightKg"),
      note: formString(formData, "note"),
      packagingQuality: formString(formData, "packagingQuality", "acceptable") as Inspection["packagingQuality"],
      session,
      shipmentId: formString(formData, "shipmentId"),
    };

    const recorded = await tryRecordInspectionLive(input);
    if (!recorded && canUseHubFixture(session)) {
      recordInspection(input);
    } else if (!recorded) {
      throw new Error("L’inspection n’a pas été confirmée.");
    }

    return requestRedirect(request, returnTo);
  } catch (error) {
    return actionError(request, error, returnTo);
  }
}
