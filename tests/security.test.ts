import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseJsonRequest } from "@/lib/api/responses";
import {
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
    expect(headers.get("Permissions-Policy")).toContain("geolocation=()");
    expect(headers.get("Strict-Transport-Security")).toContain("includeSubDomains");
  });

  it("limits outbound browser connections to Yobalelma Supabase", () => {
    expect(contentSecurityPolicy).toContain(YOBALELMA_SUPABASE_URL);
    expect(contentSecurityPolicy).toContain(
      YOBALELMA_SUPABASE_URL.replace("https://", "wss://"),
    );
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
  });
});

describe("API JSON parsing", () => {
  const schema = z.object({
    email: z.string().email(),
  });

  it("returns parsed data for valid JSON", async () => {
    const result = await parseJsonRequest(
      new Request("https://yobalelma.test/api", {
        body: JSON.stringify({ email: "client@yobalelma.test" }),
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
});
