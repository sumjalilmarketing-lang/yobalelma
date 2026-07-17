import type { NextRequest } from "next/server";
import { handoverBatch } from "@hub-app/src/lib/hub-store";
import { actionError, formBoolean, formNumber, formString, redirectTo, requestRedirect, requireHubApiSession } from "@hub-app/src/lib/http";
import { tryHandoverBatchLive } from "@hub-app/src/lib/live-hub-actions";
import { hubPickupQrCookie } from "@hub-app/src/lib/session-token";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const returnTo = redirectTo(formData, "/hub/handover");

  try {
    const session = await requireHubApiSession(request);
    const input = {
      batchId: formString(formData, "batchId"),
      measuredWeightKg: formNumber(formData, "measuredWeightKg", 0) || undefined,
      note: formString(formData, "note"),
      session,
      token: formString(formData, "token"),
      verifiedDocument: formBoolean(formData, "verifiedDocument"),
      verifiedIdentity: formBoolean(formData, "verifiedIdentity"),
      verifiedTicket: formBoolean(formData, "verifiedTicket"),
    };

    const handedOverLive = await tryHandoverBatchLive(input);

    if (!handedOverLive) {
      handoverBatch(input);
    }

    const response = requestRedirect(request, returnTo);

    if (handedOverLive) {
      response.cookies.set(hubPickupQrCookie, "", {
        httpOnly: true,
        maxAge: 0,
        path: "/hub",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (error) {
    return actionError(request, error, returnTo);
  }
}
