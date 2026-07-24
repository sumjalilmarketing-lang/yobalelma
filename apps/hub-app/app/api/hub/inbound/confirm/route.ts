import type { NextRequest } from "next/server";
import { confirmInboundManifest } from "@hub-app/src/lib/hub-store";
import { actionError, formString, redirectTo, requestRedirect, requireHubApiSession } from "@hub-app/src/lib/http";
import { canUseHubFixture, tryConfirmInboundManifestLive } from "@hub-app/src/lib/live-hub-actions";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub/inbound");

  try {
    const session = await requireHubApiSession(request);
    const manifestId = formString(formData, "manifestId");

    const confirmed = await tryConfirmInboundManifestLive(manifestId, session);
    if (!confirmed && canUseHubFixture(session)) {
      confirmInboundManifest(manifestId, session);
    } else if (!confirmed) {
      throw new Error("La réception n’a pas été confirmée.");
    }

    return requestRedirect(request, returnTo);
  } catch (error) {
    return actionError(request, error, returnTo);
  }
}
