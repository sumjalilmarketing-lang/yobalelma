import nextEnv from "@next/env";
import { fileURLToPath } from "node:url";

const { loadEnvConfig } = nextEnv;
const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

loadEnvConfig(workspaceRoot);

const port = Number(process.env.PORT ?? 43121);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const nodeBin = process.execPath.includes(" ") ? `"${process.execPath}"` : process.execPath;

const config = {
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: "list",
  timeout: 60_000,
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { browserName: "chromium", viewport: { width: 1280, height: 720 } } }],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1" ? undefined : {
    command: `${nodeBin} ../../node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
    url: baseURL
  }
};

export default config;
