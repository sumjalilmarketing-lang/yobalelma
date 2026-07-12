import { describe, expect, it } from "vitest";
import {
  createHandoverQrPayload,
  extractHandoverQrToken,
  renderQrSvg,
} from "@/lib/qr/payload";

describe("handover QR payloads", () => {
  const token = "a".repeat(64);

  it("creates an opaque Yobalelma payload and extracts the token", () => {
    const payload = createHandoverQrPayload({
      expiresAt: "2026-07-12T12:00:00.000Z",
      token,
      tokenId: "00000000-0000-0000-0000-000000000001",
      tokenType: "origin_pickup",
    });

    expect(payload).toContain('"iss":"yobalelma"');
    expect(payload).toContain('"purpose":"handover"');
    expect(extractHandoverQrToken(payload)).toBe(token);
  });

  it("accepts raw legacy tokens for scanner compatibility", () => {
    expect(extractHandoverQrToken(token)).toBe(token);
  });

  it("rejects foreign QR payloads", () => {
    expect(() => extractHandoverQrToken(JSON.stringify({ token }))).toThrow(
      "Payload QR Yobalelma invalide.",
    );
  });

  it("renders a real SVG QR code", async () => {
    const svg = await renderQrSvg(token);

    expect(svg).toContain("<svg");
    expect(svg).toContain("path");
  });
});
