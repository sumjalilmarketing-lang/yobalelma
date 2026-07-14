import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const port = Number(process.env.PORT ?? 43117);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const nodeBin = process.execPath.includes(" ") ? `"${process.execPath}"` : process.execPath;
const webServer =
  process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1"
    ? undefined
    : {
        command: `${nodeBin} node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${port}`,
        reuseExistingServer: true,
        timeout: 120_000,
        url: baseURL,
      };

const config = {
  testDir: "./tests/e2e",
  fullyParallel: false,
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
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  webServer,
};

export default config;
