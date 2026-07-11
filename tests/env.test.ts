import { describe, expect, it } from "vitest";
import {
  validatePublicEnv,
  YOBALELMA_SUPABASE_URL,
} from "@/lib/env";

describe("Yobalelma environment validation", () => {
  it("accepts the Yobalelma Supabase project URL", () => {
    expect(
      validatePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: YOBALELMA_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-publishable-key",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
      NEXT_PUBLIC_SUPABASE_URL: YOBALELMA_SUPABASE_URL,
    });
  });

  it("accepts the legacy anon key as a fallback", () => {
    expect(
      validatePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: YOBALELMA_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-anon-key",
      }).NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ).toBe("legacy-anon-key");
  });

  it("rejects another Supabase project URL", () => {
    expect(() =>
      validatePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
      }),
    ).toThrow(/Yobalelma project URL/);
  });

  it("rejects missing publishable keys", () => {
    expect(() =>
      validatePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: YOBALELMA_SUPABASE_URL,
      }),
    ).toThrow(/publishable key/);
  });
});
