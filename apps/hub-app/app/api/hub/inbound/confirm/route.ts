import type { NextRequest } from "next/server";
import { confirmInboundManifest } from "@hub-app/src/lib/hub-store";
import { actionError, formString, redirectTo, requestRedirect, requireHubApiSession } from "@hub-app/src/lib/http";
import { tryConfirmInboundManifestLive } from "@hub-app/src/lib/live-hub-actions";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub/inbound");

  try {
    const session = await requireHubApiSession(request);
    const manifestId = formString(formData, "manifestId");

    if (!(await tryConfirmInboundManifestLive(manifestId, session))) {
      confirmInboundManifest(manifestId, session);
    }

    return requestRedirect(request, returnTo);
  } catch (error) {
    return actionError(request, error, returnTo);
  }
}
