import { describe, expect, it } from "vitest";
import { yobalelmaIntentSchema } from "@/lib/validation/yobalelma-intent";

describe("Yobalelma intent schema", () => {
  it("accepts a sender intent", () => {
    const result = yobalelmaIntentSchema.parse({
      intent: "send_parcel",
      origin: "Paris",
      destination: "Dakar",
    });

    expect(result.intent).toBe("send_parcel");
  });

  it("rejects unknown intents", () => {
    expect(() =>
      yobalelmaIntentSchema.parse({
        intent: "unknown",
      }),
    ).toThrow();
  });
});

