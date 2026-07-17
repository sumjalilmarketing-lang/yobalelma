import { describe, expect, it } from "vitest";
import { createEnterpriseDemoState } from "../src/lib/enterprise-data";
import { createExportTable, exportQuerySchema, toCsv, toExcelXml, toPdf, toPrintableHtml } from "../src/lib/enterprise-export";
import type { HubSession } from "../src/lib/types";
import { createIdempotencyKey, enqueueDeferredAction, withRetry } from "../src/lib/resilience";

const session: HubSession = { email: "operations@yobalelma.test", expiresAt: Date.now() + 1000, hubId: "hub-dss", name: "Operations", role: "operations_manager", sessionId: "test", source: "demo" };

describe("Enterprise Hub", () => {
  it("exposes six hubs to operations managers and one to agents", () => { expect(createEnterpriseDemoState(session).hubs).toHaveLength(6); expect(createEnterpriseDemoState({ ...session, role: "hub_agent" }).hubs).toHaveLength(1); });
  it("validates export parameters", () => { expect(exportQuerySchema.safeParse({ type: "audit", format: "pdf" }).success).toBe(true); expect(exportQuerySchema.safeParse({ type: "secrets", format: "pdf" }).success).toBe(false); });
  it("creates CSV, Excel, PDF and printable output", () => { const table = createExportTable(createEnterpriseDemoState(session), "inventory"); expect(toCsv(table)).toContain("DSS-DAKAR"); expect(toExcelXml(table)).toContain("Workbook"); expect(toPdf(table, "Operations", new Date().toISOString()).subarray(0, 4).toString()).toBe("%PDF"); expect(toPrintableHtml(table, "Operations", new Date().toISOString())).toContain("@page{size:A4"); });
  it("marks recommendations as assistive only", () => { const state = createEnterpriseDemoState(session); expect(state.forecasts.length).toBeGreaterThan(0); expect(state.agents.every((agent) => agent.productivity <= 100)).toBe(true); });
  it("retries transient failures and deduplicates deferred actions", async () => { let calls = 0; await expect(withRetry(async () => { calls += 1; if (calls < 2) throw new Error("temporary"); return "ok"; }, { baseDelayMs: 1 })).resolves.toBe("ok"); const id = createIdempotencyKey("scan", "YBL-001", 1); const queued = enqueueDeferredAction(enqueueDeferredAction([], { id, method: "POST", path: "/api/hub/inbound/scan", payload: {} }), { id, method: "POST", path: "/api/hub/inbound/scan", payload: {} }); expect(queued).toHaveLength(1); });
});
