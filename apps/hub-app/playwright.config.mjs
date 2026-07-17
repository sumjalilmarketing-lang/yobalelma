import nextEnv from "@next/env";
import { fileURLToPath } from "node:url";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(fileURLToPath(new URL("../..", import.meta.url)));

const port = Number(process.env.PORT ?? 43122);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const nodeBin = process.execPath.includes(" ") ? `"${process.execPath}"` : process.execPath;
const webServer =
  process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1"
    ? undefined
    : {
        command: `${nodeBin} scripts/next-with-root-env.mjs dev --hostname 127.0.0.1 --port ${port}`,
        reuseExistingServer: true,
        timeout: 120_000,
        url: baseURL,
      };

const config = {
  testDir: "./tests/e2e",
  fullyParallel: false,
  outputDir: "./test-results",
  reporter: "list",
  timeout: 60_000,
  workers: Number(process.env.PLAYWRIGHT_WORKERS ?? 1),
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 1366, height: 768 },
      },
    },
  ],
  webServer,
};

export default config;
