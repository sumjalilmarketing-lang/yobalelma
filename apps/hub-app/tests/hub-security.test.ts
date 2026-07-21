import { afterEach, describe, expect, it, vi } from "vitest";
import { correlationId, structuredLog } from "../src/lib/observability";
import {
  createHubSessionToken,
  createHubPickupQrToken,
  verifyHubSessionToken,
  verifyHubPickupQrToken,
} from "../src/lib/session-token";
import { isSafeRelativePath } from "../src/lib/http";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("Hub staging security", () => {
  it("signs short-lived pickup QR values and rejects tampering", async () => {
    vi.stubEnv("HUB_SESSION_SECRET", "hub-test-secret-at-least-thirty-two-characters");
    const pickup = {
      batchId: "batch-pilot",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      hubId: "hub-pilot",
      id: "token-pilot",
      revoked: false,
      token: "opaque-pilot-token",
      travelerId: "traveler-pilot",
      tripId: "trip-pilot",
    };
    const signed = await createHubPickupQrToken(pickup);

    await expect(verifyHubPickupQrToken(signed)).resolves.toEqual(pickup);
    await expect(verifyHubPickupQrToken(`${signed.slice(0, -1)}x`)).resolves.toBeNull();
    await expect(verifyHubPickupQrToken(`${signed}.ignored`)).resolves.toBeNull();
  });

  it("accepts safe correlation ids and replaces invalid values", () => {
    expect(correlationId(new Request("https://hub.yobalelma.test", {
      headers: { "x-correlation-id": "pilot-request-123" },
    }))).toBe("pilot-request-123");
    expect(correlationId(new Request("https://hub.yobalelma.test", {
      headers: { "x-correlation-id": "unsafe value" },
    }))).toMatch(/^[0-9a-f-]{36}$/u);
  });

  it("rejects custom demo sessions in production and unsafe redirects", async () => {
    vi.stubEnv("HUB_SESSION_SECRET", "hub-test-secret-at-least-thirty-two-characters");
    const token = await createHubSessionToken({ email: "agent@yobalelma.test", expiresAt: Date.now() + 60_000, hubId: "hub-test", name: "Agent", role: "hub_agent", sessionId: "test", source: "demo" });
    vi.stubEnv("NODE_ENV", "production");
    await expect(verifyHubSessionToken(token)).resolves.toBeNull();
    expect(isSafeRelativePath("/hub/scanner")).toBe(true);
    expect(isSafeRelativePath("//malicious.example")).toBe(false);
    expect(isSafeRelativePath("/\\malicious.example")).toBe(false);
  });

  it("redacts credentials and emails from structured logs", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    structuredLog("error", "hub_api_failed", {
      detail: "Bearer secret.token.value for pilot@yobalelma.test",
    });

    expect(error).toHaveBeenCalledOnce();
    const payload = String(error.mock.calls[0]?.[0]);
    expect(payload).toContain("Bearer [redacted]");
    expect(payload).toContain("[email]");
    expect(payload).not.toContain("pilot@yobalelma.test");
  });
});
