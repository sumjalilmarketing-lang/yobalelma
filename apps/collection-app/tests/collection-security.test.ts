import { describe, expect, it } from "vitest";
import { canUseCollectionRoute, collectionNavigation, hasCollectionPermission } from "../src/lib/permissions";
import { createCollectionSessionToken, verifyCollectionSessionToken } from "../src/lib/session-token";

describe("Collection access control", () => {
  it("exposes all production modules", () => { expect(collectionNavigation).toHaveLength(31); expect(new Set(collectionNavigation.map((item)=>item.href)).size).toBe(31); });
  it("separates driver and manager permissions", () => { expect(hasCollectionPermission("collection_driver","collection:write")).toBe(true); expect(canUseCollectionRoute("collection_driver","/collection/settings")).toBe(false); expect(canUseCollectionRoute("collection_manager","/collection/settings")).toBe(true); });
  it("signs and rejects tampered sessions", async () => { const token=await createCollectionSessionToken({email:"driver@yobalelma.test",expiresAt:Date.now()+60_000,name:"Driver",role:"collection_driver",sessionId:"test"}); expect((await verifyCollectionSessionToken(token))?.role).toBe("collection_driver"); expect(await verifyCollectionSessionToken(`${token}x`)).toBeNull(); });
});
