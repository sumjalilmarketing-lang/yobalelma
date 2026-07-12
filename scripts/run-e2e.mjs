import { spawn } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const port = Number(process.env.PORT ?? 43117);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const e2eDistDir = process.env.NEXT_DIST_DIR ?? ".next-e2e";
const passthroughArgs = process.argv.slice(2);
const serverLogs = [];
const nextTypeFiles = ["next-env.d.ts", "tsconfig.json"];

let ownedServer;
let nextTypeFileSnapshots = [];

try {
  if (process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "1") {
    if (await isReady(baseURL)) {
      console.log(`[e2e] Reusing ${baseURL}`);
    } else {
      await snapshotNextTypeFiles();
      await prepareE2eDistDir();
      ownedServer = startNextServer();
      await waitForServer(baseURL);
    }
  }

  const exitCode = await runPlaywright();
  process.exitCode = exitCode;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  printServerLogs();
  process.exitCode = 1;
} finally {
  await stopOwnedServer();
  await restoreNextTypeFiles();
}

function startNextServer() {
  console.log(`[e2e] Starting Next.js on ${baseURL}`);

  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_DIST_DIR: e2eDistDir,
        PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );

  child.stdout.on("data", rememberServerLog);
  child.stderr.on("data", rememberServerLog);

  return child;
}

async function runPlaywright() {
  const cliPath = "node_modules/playwright/cli.js";
  const child = spawn(process.execPath, [cliPath, "test", ...passthroughArgs], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_DIST_DIR: e2eDistDir,
      PLAYWRIGHT_BASE_URL: baseURL,
      PLAYWRIGHT_SKIP_WEBSERVER: "1",
      PORT: String(port),
    },
    stdio: "inherit",
    windowsHide: true,
  });

  return new Promise((resolve) => {
    child.on("exit", (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }

      resolve(code ?? 1);
    });
  });
}

async function waitForServer(url) {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    if (ownedServer?.exitCode !== null) {
      throw new Error(`[e2e] Next.js stopped before becoming ready.`);
    }

    if (await isReady(url)) {
      console.log(`[e2e] Ready at ${url}`);
      return;
    }

    await delay(1_000);
  }

  throw new Error(`[e2e] Next.js did not become ready at ${url}.`);
}

async function prepareE2eDistDir() {
  if (process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1") {
    return;
  }

  const cwd = path.resolve(process.cwd());
  const target = path.resolve(cwd, e2eDistDir);

  if (!target.startsWith(`${cwd}${path.sep}`)) {
    throw new Error(`[e2e] Refusing to clean NEXT_DIST_DIR outside the workspace.`);
  }

  await rm(target, { force: true, recursive: true });
}

async function snapshotNextTypeFiles() {
  nextTypeFileSnapshots = await Promise.all(
    nextTypeFiles.map(async (file) => ({
      content: await readFile(file, "utf8"),
      file,
    })),
  );
}

async function restoreNextTypeFiles() {
  if (nextTypeFileSnapshots.length === 0) {
    return;
  }

  await Promise.all(
    nextTypeFileSnapshots.map(async ({ content, file }) => {
      const current = await readFile(file, "utf8");

      if (current !== content) {
        await writeFile(file, content, "utf8");
      }
    }),
  );
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

  console.error("[e2e] Last Next.js logs:");
  console.error(serverLogs.join(""));
}
