import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import nextEnv from "@next/env";

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const workspaceRoot = path.resolve(appDir, "../..");
const port = Number(process.env.PORT ?? 43121);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const distDir = process.env.NEXT_DIST_DIR ?? ".next-e2e";
const nextCli = path.join(workspaceRoot, "node_modules", "next", "dist", "bin", "next");
const playwrightCli = path.join(workspaceRoot, "node_modules", "playwright", "cli.js");
const passthroughArgs = process.argv.slice(2);
const serverLogs = [];

let ownedServer;

const { loadEnvConfig } = nextEnv;

loadEnvConfig(workspaceRoot);

try {
  if (process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "1") {
    if (await isReady(baseURL)) {
      console.log(`[user-app:e2e] Reusing ${baseURL}`);
    } else {
      await prepareDistDir();
      ownedServer = startNextServer();
      await waitForServer(baseURL);
    }
  }

  process.exitCode = await runPlaywright();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  printServerLogs();
  process.exitCode = 1;
} finally {
  await stopOwnedServer();
}

function startNextServer() {
  console.log(`[user-app:e2e] Starting Next.js on ${baseURL}`);

  const child = spawn(
    process.execPath,
    [nextCli, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: appDir,
      env: {
        ...process.env,
        NEXT_DIST_DIR: distDir,
        PORT: String(port),
        YOBALELMA_EXPOSE_TEST_OTP: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );

  child.stdout.on("data", rememberServerLog);
  child.stderr.on("data", rememberServerLog);

  return child;
}

function runPlaywright() {
  const child = spawn(
    process.execPath,
    [
      playwrightCli,
      "test",
      "--config",
      path.join(appDir, "playwright.config.mjs"),
      ...passthroughArgs,
    ],
    {
      cwd: appDir,
      env: {
        ...process.env,
        NEXT_DIST_DIR: distDir,
        PLAYWRIGHT_BASE_URL: baseURL,
        PLAYWRIGHT_SKIP_WEBSERVER: "1",
        PORT: String(port),
        YOBALELMA_EXPOSE_TEST_OTP: "1",
      },
      stdio: "inherit",
      windowsHide: true,
    },
  );

  return new Promise((resolve) => {
    child.on("exit", (code, signal) => {
      resolve(signal ? 1 : (code ?? 1));
    });
  });
}

async function prepareDistDir() {
  const target = path.resolve(appDir, distDir);

  const relativeTarget = path.relative(appDir, target);

  if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
    throw new Error("[user-app:e2e] Refusing to clean NEXT_DIST_DIR outside user-app.");
  }

  await rm(target, { force: true, recursive: true });
}

async function waitForServer(url) {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    if (ownedServer?.exitCode !== null) {
      throw new Error("[user-app:e2e] Next.js stopped before becoming ready.");
    }

    if (await isReady(url)) {
      console.log(`[user-app:e2e] Ready at ${url}`);
      return;
    }

    await delay(1_000);
  }

  throw new Error(`[user-app:e2e] Next.js did not become ready at ${url}.`);
}

async function isReady(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

async function stopOwnedServer() {
  if (!ownedServer || ownedServer.exitCode !== null) {
    return;
  }

  ownedServer.kill();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (ownedServer.exitCode !== null) {
      return;
    }

    await delay(100);
  }

  ownedServer.kill("SIGKILL");
}

function rememberServerLog(chunk) {
  const text = chunk.toString();
  serverLogs.push(text);

  if (serverLogs.length > 20) {
    serverLogs.shift();
  }

  if (process.env.PLAYWRIGHT_VERBOSE_SERVER === "1") {
    process.stdout.write(text);
  }
}

function printServerLogs() {
  if (serverLogs.length === 0) {
    return;
  }

  console.error("[user-app:e2e] Last Next.js logs:");
  console.error(serverLogs.join(""));
}
