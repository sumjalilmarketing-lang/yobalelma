import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "SUPABASE_ACCESS_TOKEN",
];

const envPath = path.join(process.cwd(), ".env.local");

function parseEnvNames(filePath) {
  if (!existsSync(filePath)) {
    return {
      formatIssues: [],
      names: [],
    };
  }

  const names = [];
  const formatIssues = [];
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);

    if (!match) {
      formatIssues.push({
        issue: "invalid assignment syntax",
        line: index + 1,
      });
      return;
    }

    names.push(match[1]);
  });

  return {
    formatIssues,
    names: [...new Set(names)].sort(),
  };
}

const beforeNextEnv = Object.fromEntries(
  REQUIRED_ENV.map((name) => [name, Boolean(process.env[name])]),
);
const parsed = parseEnvNames(envPath);

loadEnvConfig(process.cwd());

const diagnostics = {
  cwd: process.cwd(),
  envFile: {
    exists: existsSync(envPath),
    path: envPath,
  },
  formatIssues: parsed.formatIssues,
  loader: "@next/env",
  parsedVariableNames: parsed.names,
  required: REQUIRED_ENV.map((name) => ({
    name,
    presentAfterNextEnvLoad: Boolean(process.env[name]),
    presentBeforeNextEnvLoad: beforeNextEnv[name],
    presentInFile: parsed.names.includes(name),
  })),
  shell: process.env.ComSpec ? "cmd/powershell-compatible" : "unknown",
};

console.log(JSON.stringify(diagnostics, null, 2));
