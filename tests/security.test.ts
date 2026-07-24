import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { buildAuthCallbackUrl, getTrustedAppOrigin } from "@/lib/auth/redirect";
import { parseJsonRequest } from "@/lib/api/responses";
import {
  buildContentSecurityPolicy,
  contentSecurityPolicy,
  securityHeaders,
} from "@/lib/security/headers";
import { YOBALELMA_SUPABASE_URL } from "@/lib/env";

describe("security headers", () => {
  it("declares baseline production browser protections", () => {
    const headers = new Map(securityHeaders.map((header) => [header.key, header.value]));

    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toContain("geolocation=(self)");
    expect(headers.get("Strict-Transport-Security")).toContain("includeSubDomains");
  });

  it("limits outbound browser connections to Yobalelma Supabase", () => {
    expect(contentSecurityPolicy).toContain(YOBALELMA_SUPABASE_URL);
    expect(contentSecurityPolicy).toContain(
      YOBALELMA_SUPABASE_URL.replace("https://", "wss://"),
    );
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).not.toContain("'unsafe-eval'");
  });

  it("allows development-only eval for the Next.js dev server but not production", () => {
    expect(buildContentSecurityPolicy("development")).toContain("'unsafe-eval'");
    expect(buildContentSecurityPolicy("production")).not.toContain("'unsafe-eval'");
    expect(buildContentSecurityPolicy("test")).not.toContain("'unsafe-eval'");
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("API JSON parsing", () => {
  const schema = z.object({
    email: z.string().email(),
  });

  it("returns parsed data for valid JSON", async () => {
    const result = await parseJsonRequest(
      new Request("https://yobalelma.test/api", {
        body: JSON.stringify({ email: "client@yobalelma.test" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
      schema,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data.email).toBe("client@yobalelma.test");
    }
  });

  it("returns a 400 response for malformed JSON", async () => {
    const result = await parseJsonRequest(
      new Request("https://yobalelma.test/api", {
        body: "{not-json",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
      schema,
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.response.status).toBe(400);
      await expect(result.response.json()).resolves.toMatchObject({
        ok: false,
      });
    }
  });

  it("rejects oversized JSON before parsing", async () => {
    const result = await parseJsonRequest(
      new Request("https://yobalelma.test/api", {
        body: JSON.stringify({ email: "client@yobalelma.test" }),
        headers: {
          "Content-Length": "999999",
          "Content-Type": "application/json",
        },
        method: "POST",
      }),
      schema,
      { maxBytes: 32 },
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.response.status).toBe(413);
    }
  });

  it("rejects explicit non-json content types", async () => {
    const result = await parseJsonRequest(
      new Request("https://yobalelma.test/api", {
        body: "email=client@yobalelma.test",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        method: "POST",
      }),
      schema,
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.response.status).toBe(415);
    }
  });
});

describe("auth callback URL building", () => {
  it("uses the configured app URL instead of the spoofable Origin header", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.yobalelma.test");

    const request = new Request("https://internal.yobalelma.test/api/auth/sign-in", {
      headers: { Origin: "https://evil.example" },
      method: "POST",
    });

    expect(buildAuthCallbackUrl(request, "/dashboard")).toBe(
      "https://app.yobalelma.test/auth/callback?next=%2Fdashboard",
    );
  });

  it("falls back to the request origin when no trusted app URL is configured", () => {
    expect(
      getTrustedAppOrigin(
        "https://request.yobalelma.test/api/auth/sign-in",
        undefined,
      ),
    ).toBe("https://request.yobalelma.test");
  });

  it("uses forwarded staging origin when the configured app URL is local", () => {
    const headers = new Headers({
      host: "localhost:43121",
      "x-forwarded-host": "staging.yobalelma.test",
      "x-forwarded-proto": "https",
    });

    expect(
      getTrustedAppOrigin(
        "http://localhost:43121/api/auth/sign-in",
        "http://localhost:43121",
        headers,
      ),
    ).toBe("https://staging.yobalelma.test");
  });
});
