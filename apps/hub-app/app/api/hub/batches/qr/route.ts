import type { NextRequest } from "next/server";
import { generatePickupQr, markBatchReady } from "@hub-app/src/lib/hub-store";
import { actionError, formString, redirectTo, requestRedirect, requireHubApiSession } from "@hub-app/src/lib/http";
import { tryGeneratePickupQrLive } from "@hub-app/src/lib/live-hub-actions";
import { createHubPickupQrToken, hubPickupQrCookie } from "@hub-app/src/lib/session-token";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub/batches");

  try {
    const session = await requireHubApiSession(request);
    const batchId = formString(formData, "batchId");
    const liveQr = await tryGeneratePickupQrLive(batchId, session);

    if (!liveQr) {
      markBatchReady(batchId, session);
      generatePickupQr(batchId, session);
      return requestRedirect(request, returnTo);
    }

    const response = requestRedirect(request, returnTo);
    response.cookies.set(hubPickupQrCookie, await createHubPickupQrToken(liveQr), {
      httpOnly: true,
      maxAge: Math.max(Math.floor((new Date(liveQr.expiresAt).getTime() - Date.now()) / 1000), 60),
      path: "/hub",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    return actionError(request, error, returnTo);
  }
}
