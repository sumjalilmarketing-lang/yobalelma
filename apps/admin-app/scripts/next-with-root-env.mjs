import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { spawn } from "node:child_process";

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { loadEnvConfig } = nextEnv;
loadEnvConfig(path.resolve(appDir, "../.."), process.env.NODE_ENV !== "production");
const nextCli = path.resolve(appDir, "../../node_modules/next/dist/bin/next");
const child = spawn(process.execPath, [nextCli, ...process.argv.slice(2)], { cwd: appDir, env: process.env, stdio: "inherit", windowsHide: true });
child.on("exit", (code) => process.exit(code ?? 1));
