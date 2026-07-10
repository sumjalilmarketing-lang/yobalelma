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
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      }),
    ).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: YOBALELMA_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    });
  });

  it("rejects another Supabase project URL", () => {
    expect(() =>
      validatePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      }),
    ).toThrow(/Yobalelma project URL/);
  });

  it("rejects missing anon keys", () => {
    expect(() =>
      validatePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: YOBALELMA_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      }),
    ).toThrow(/anon key/);
  });
});
