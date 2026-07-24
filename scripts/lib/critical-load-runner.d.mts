export type LoadStep = { name: string; method: "GET" | "POST" | "PATCH"; path: string; expectedStatus?: number; timeoutMs?: number; body?: unknown };
export type LoadScenario = { name?: string; steps: LoadStep[] };
export function validateLoadTarget(rawUrl: string, targetClass: string): string;
export function validateScenario(scenario: LoadScenario): Required<Pick<LoadScenario, "steps">> & LoadScenario;
export function percentile(values: number[], ratio: number): number;
export function runCriticalLoad(input: { baseUrl: string; concurrency: number; iterations: number; scenario: LoadScenario; authorization?: string; runId?: string }): Promise<{ runId: string; iterations: number; concurrency: number; requests: number; failures: number; errorRate: number; durationMs: number; p50Ms: number; p95Ms: number; p99Ms: number }>;
