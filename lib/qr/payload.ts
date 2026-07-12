import QRCode from "qrcode";

export type HandoverQrPayloadInput = {
  expiresAt: string;
  token: string;
  tokenId: string;
  tokenType: "origin_pickup" | "destination_dropoff";
};

export type HandoverQrPayload = {
  iss: "yobalelma";
  purpose: "handover";
  token: string;
  tokenId: string;
  tokenType: "origin_pickup" | "destination_dropoff";
  v: 1;
  exp: string;
};

export function createHandoverQrPayload(input: HandoverQrPayloadInput) {
  return JSON.stringify({
    exp: input.expiresAt,
    iss: "yobalelma",
    purpose: "handover",
    token: input.token,
    tokenId: input.tokenId,
    tokenType: input.tokenType,
    v: 1,
  } satisfies HandoverQrPayload);
}

export function extractHandoverQrToken(value: string) {
  const trimmed = value.trim();

  if (!trimmed.startsWith("{")) {
    return trimmed;
  }

  const parsed = JSON.parse(trimmed) as Partial<HandoverQrPayload>;

  if (
    parsed.iss !== "yobalelma" ||
    parsed.purpose !== "handover" ||
    parsed.v !== 1 ||
    typeof parsed.token !== "string"
  ) {
    throw new Error("Payload QR Yobalelma invalide.");
  }

  return parsed.token.trim();
}

export async function renderQrSvg(payload: string) {
  return QRCode.toString(payload, {
    color: {
      dark: "#111111",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
    margin: 1,
    type: "svg",
    width: 320,
  });
}
