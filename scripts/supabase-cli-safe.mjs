import { spawn } from "node:child_process";
import process from "node:process";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd(), false, { info: () => undefined, error: () => undefined });

const SECRET_ENV_NAMES = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const postgresUrlPattern = new RegExp(
  String.raw`postgres(?:ql)?:` + String.raw`\/\/` + String.raw`[^\s'"` + "`" + String.raw`<>]+`,
  "gi",
);
const redactedPostgresUrl = "postgresql:" + "//[redacted]";

function usage() {
  console.error(
    "Usage: node scripts/supabase-cli-safe.mjs <supabase args...> [--db-url-env DATABASE_URL]",
  );
}

function secretValues() {
  return SECRET_ENV_NAMES.map((name) => process.env[name]).filter(
    (value) => typeof value === "string" && value.length > 0,
  );
}

function redact(text) {
  let safe = text;

  for (const value of secretValues()) {
    safe = safe.split(value).join(`[redacted:${value.length}]`);
  }

  return safe
    .replace(postgresUrlPattern, redactedPostgresUrl)
    .replace(/sbp_[A-Za-z0-9_-]+/g, "sbp_[redacted]")
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, "sb_secret_[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "jwt_[redacted]");
}

function normalizeArgs(argv) {
  const normalized = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--db-url-env" || arg === "--db-url-env-require-ssl") {
      const envName = argv[index + 1];

      if (!envName || !process.env[envName]) {
        throw new Error(`Missing environment variable for --db-url-env: ${envName ?? "(none)"}`);
      }

      let dbUrlEnvName = envName;

      if (arg === "--db-url-env-require-ssl") {
        const url = new URL(process.env[envName]);
        url.searchParams.set("sslmode", "require");
        dbUrlEnvName = "__SUPABASE_SAFE_DB_URL";
        process.env[dbUrlEnvName] = url.toString();
      }

      normalized.push({ kind: "literal", value: "--db-url" }, { kind: "env", value: dbUrlEnvName });
      index += 1;
      continue;
    }

    if (arg === "--token-env") {
      const envName = argv[index + 1];

      if (!envName || !process.env[envName]) {
        throw new Error(`Missing environment variable for --token-env: ${envName ?? "(none)"}`);
      }

      normalized.push({ kind: "literal", value: "--token" }, { kind: "env", value: envName });
      index += 1;
      continue;
    }

    normalized.push({ kind: "literal", value: arg });
  }

  return normalized;
}

function quoteCmdArg(arg) {
  if (/^[A-Za-z0-9_./:=@-]+$/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/(["^&|<>])/g, "^$1")}"`;
}

function windowsCommand(npxCommand, supabaseArgs) {
  const renderedArgs = supabaseArgs.map((arg) => {
    if (arg.kind === "env") {
      return `%${arg.value}%`;
    }

    return quoteCmdArg(arg.value);
  });

  return `${quoteCmdArg(npxCommand)} supabase ${renderedArgs.join(" ")}`;
}

async function main() {
  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0) {
    usage();
    process.exitCode = 2;
    return;
  }

  const supabaseArgs = normalizeArgs(rawArgs);
  const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
  const command = process.platform === "win32" ? "cmd.exe" : npxCommand;
  const args =
    process.platform === "win32"
      ? ["/d", "/c", windowsCommand(npxCommand, supabaseArgs)]
      : ["supabase", ...supabaseArgs.map((arg) => (arg.kind === "env" ? process.env[arg.value] : arg.value))];

  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(redact(chunk.toString()));
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(redact(chunk.toString()));
  });

  const exitCode = await new Promise((resolve) => {
    child.on("close", resolve);
  });

  process.exitCode = Number(exitCode);
}

main().catch((error) => {
  console.error(redact(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
