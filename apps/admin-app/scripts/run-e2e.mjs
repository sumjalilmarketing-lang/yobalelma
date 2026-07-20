import { spawn } from "node:child_process";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const workspaceRoot = path.resolve(appDir, "../..");
const nextCli = path.join(workspaceRoot, "node_modules", "next", "dist", "bin", "next");
const playwrightCli = path.join(workspaceRoot, "node_modules", "@playwright", "test", "cli.js");
loadEnvConfig(workspaceRoot, true);
const port = Number(process.env.PORT ?? 43244);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
let server;
try {
  if (process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "1" && !(await ready())) {
    server = spawn(process.execPath, [nextCli, "dev", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: appDir, env: { ...process.env, NEXT_DIST_DIR: ".next-e2e", PORT: String(port) }, stdio: "inherit", windowsHide: true });
    for (let index = 0; index < 120 && !(await ready()); index += 1) await delay(1000);
    if (!(await ready())) throw new Error(`Admin App indisponible sur ${baseURL}`);
  }
  const child = spawn(process.execPath, [playwrightCli, "test", ...process.argv.slice(2)], { cwd: appDir, env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL, PLAYWRIGHT_SKIP_WEBSERVER: "1" }, stdio: "inherit", windowsHide: true });
  process.exitCode = await new Promise((resolve) => child.on("exit", (code, signal) => resolve(signal ? 1 : (code ?? 1))));
} finally { server?.kill(); }
async function ready() { try { const response = await fetch(`${baseURL}/api/health`, { signal: AbortSignal.timeout(2000) }); const payload = await response.json(); return response.status < 500 && payload.application === "Yobalelma Command"; } catch { return false; } }
