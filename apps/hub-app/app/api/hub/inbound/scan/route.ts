import type { NextRequest } from "next/server";
import { scanInboundPackage } from "@hub-app/src/lib/hub-store";
import { actionError, formNumber, formString, redirectTo, requestRedirect, requireHubApiSession } from "@hub-app/src/lib/http";
import { tryScanInboundPackageLive } from "@hub-app/src/lib/live-hub-actions";
import type { InboundItemStatus } from "@hub-app/src/lib/types";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub/scanner");

  try {
    const session = await requireHubApiSession(request);
    const input = {
      manifestId: formString(formData, "manifestId"),
      note: formString(formData, "note"),
      photoCount: formNumber(formData, "photoCount", 0),
      session,
      status: formString(formData, "status", "received_at_hub") as InboundItemStatus,
      trackingCode: formString(formData, "trackingCode"),
    };

    if (!(await tryScanInboundPackageLive(input))) {
      scanInboundPackage(input);
    }

    return requestRedirect(request, returnTo);
  } catch (error) {
    return actionError(request, error, returnTo);
  }
}
