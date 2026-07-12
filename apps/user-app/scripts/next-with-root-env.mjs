import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const workspaceRoot = path.resolve(appDir, "../..");
const nextCli = path.join(workspaceRoot, "node_modules", "next", "dist", "bin", "next");
const [command = "dev", ...args] = process.argv.slice(2);

loadEnvConfig(workspaceRoot, command === "dev");

const child = spawn(process.execPath, [nextCli, command, ...args], {
  cwd: appDir,
  env: {
    ...process.env,
  },
  stdio: "inherit",
  windowsHide: true,
});

child.on("exit", (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1);
});
