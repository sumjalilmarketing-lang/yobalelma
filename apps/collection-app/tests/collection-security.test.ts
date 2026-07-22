import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { canUseCollectionRoute, collectionNavigation, hasCollectionPermission } from "../src/lib/permissions";
import { createCollectionSessionToken, verifyCollectionSessionToken } from "../src/lib/session-token";

describe("Collection access control", () => {
  it("exposes all production modules", () => { expect(collectionNavigation).toHaveLength(31); expect(new Set(collectionNavigation.map((item)=>item.href)).size).toBe(31); });
  it("separates driver and manager permissions", () => { expect(hasCollectionPermission("collection_driver","collection:write")).toBe(true); expect(canUseCollectionRoute("collection_driver","/collection/settings")).toBe(false); expect(canUseCollectionRoute("collection_manager","/collection/settings")).toBe(true); });
  it("signs and rejects tampered sessions", async () => { const token=await createCollectionSessionToken({email:"driver@yobalelma.test",expiresAt:Date.now()+60_000,name:"Driver",role:"collection_driver",sessionId:"test"}); expect((await verifyCollectionSessionToken(token))?.role).toBe("collection_driver"); expect(await verifyCollectionSessionToken(`${token}x`)).toBeNull(); });
  it("rejects custom sessions in production", async () => { const token=await createCollectionSessionToken({email:"driver@yobalelma.test",expiresAt:Date.now()+60_000,name:"Driver",role:"collection_driver",sessionId:"test",source:"demo"}); vi.stubEnv("NODE_ENV","production"); expect(await verifyCollectionSessionToken(token)).toBeNull(); });
  it("does not report failed scans as queued or validated", async () => { const source=await readFile(path.resolve(process.cwd(),"apps/collection-app/src/components/collection-pages.tsx"),"utf8"); expect(source).not.toContain('yobalelma.collection.pending'); expect(source).not.toContain('placé dans la file sécurisée'); expect(source).toContain('L’opération n’a pas été enregistrée'); });
  it("loads production Collection pages from Supabase instead of fixtures", async () => { const page=await readFile(path.resolve(process.cwd(),"apps/collection-app/app/collection/[[...segments]]/page.tsx"),"utf8"); expect(page).toContain("loadCollectionState"); expect(page).not.toContain("getCollectionState"); expect(page).not.toContain("collection-store"); });
  it("does not present fixed operational identities or KPIs", async () => { const source=await readFile(path.resolve(process.cwd(),"apps/collection-app/src/components/collection-pages.tsx"),"utf8"); for (const value of ["Ibrahima Diagne","Relais Parcelles","38,2 km","18:42","moduleCopy"]) expect(source).not.toContain(value); });
  it("persists GPS through the authorized database function", async () => { const source=await readFile(path.resolve(process.cwd(),"apps/collection-app/app/api/collection/gps/route.ts"),"utf8"); expect(source).toContain('rpc("record_collection_gps"'); expect(source).toContain('session.source !== "supabase"'); expect(source).toContain("routeId: z.string().uuid()"); });
});

afterEach(() => vi.unstubAllEnvs());
