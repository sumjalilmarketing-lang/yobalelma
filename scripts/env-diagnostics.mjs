import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const CHECKED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "DATABASE_URL",
  "DIRECT_URL",
  "SUPABASE_PROJECT_REF",
];

const envPath = path.join(process.cwd(), ".env.local");

function classifyFormat(name, value) {
  if (!value) {
    return "empty";
  }

  if (/\[YOUR-PASSWORD\]|ta_cl|ton_|your_|example|changeme|placeholder/i.test(value)) {
    return "placeholder-like";
  }

  if (name === "NEXT_PUBLIC_SUPABASE_URL") {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(value)
      ? "supabase-url-like"
      : "not-supabase-url-like";
  }

  if (name === "DATABASE_URL" || name === "DIRECT_URL") {
    try {
      const url = new URL(value);
      const validProtocol = url.protocol === "postgres:" || url.protocol === "postgresql:";
      const hasConnectionParts = Boolean(url.hostname && url.username && url.pathname);

      return validProtocol && hasConnectionParts ? "postgres-uri-like" : "not-postgres-uri-like";
    } catch {
      return "not-postgres-uri-like";
    }
  }

  if (name === "SUPABASE_PROJECT_REF") {
    return /^[a-z0-9]{20}$/i.test(value) ? "project-ref-like" : "not-project-ref-like";
  }

  if (name === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
    return /^(sb_publishable_|eyJ)/.test(value) ? "publishable-key-like" : "not-publishable-key-like";
  }

  if (name === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
    return /^(sb_publishable_|eyJ)/.test(value) ? "anon-key-like" : "not-anon-key-like";
  }

  if (name === "SUPABASE_SERVICE_ROLE_KEY") {
    return /^(sb_secret_|eyJ)/.test(value) ? "service-role-key-like" : "not-service-role-key-like";
  }

  if (name === "SUPABASE_ACCESS_TOKEN") {
    return /^sbp_/.test(value) ? "access-token-like" : "not-access-token-like";
  }

  return "nonempty";
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {
      entries: [],
      formatIssues: [],
      names: [],
    };
  }

  const entries = [];
  const names = [];
  const formatIssues = [];
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    if (/^\s+/.test(line) || /\s+=/.test(line)) {
      formatIssues.push({
        issue: "unexpected space around variable assignment",
        line: index + 1,
      });
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);

    if (!match) {
      formatIssues.push({
        issue: "invalid assignment syntax",
        line: index + 1,
      });
      return;
    }

    const name = match[1];
    const separatorIndex = trimmed.indexOf("=");
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    names.push(name);
    entries.push({
      empty: value.length === 0,
      format: classifyFormat(name, value),
      line: index + 1,
      name,
      placeholderLike: /\[YOUR-PASSWORD\]|ta_cl|ton_|your_|example|changeme|placeholder/i.test(value),
    });
  });

  return {
    entries,
    formatIssues,
    names: [...new Set(names)].sort(),
  };
}

const beforeNextEnv = Object.fromEntries(
  CHECKED_ENV.map((name) => [name, Boolean(process.env[name])]),
);
const parsed = parseEnvFile(envPath);

loadEnvConfig(process.cwd());

const hasPublishableOrAnon = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const diagnostics = {
  cwd: process.cwd(),
  envFile: {
    exists: existsSync(envPath),
    path: envPath,
  },
  formatIssues: parsed.formatIssues,
  loader: "@next/env",
  parsedVariableNames: parsed.names,
  requiredGroups: [
    {
      name: "supabase public key",
      satisfied: hasPublishableOrAnon,
      acceptedVariables: ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    },
  ],
  variables: CHECKED_ENV.map((name) => ({
    diagnostics: parsed.entries.find((entry) => entry.name === name) ?? null,
    name,
    presentAfterNextEnvLoad: Boolean(process.env[name]),
    presentBeforeNextEnvLoad: beforeNextEnv[name],
    presentInFile: parsed.names.includes(name),
  })),
  shell: process.env.ComSpec ? "cmd/powershell-compatible" : "unknown",
};

console.log(JSON.stringify(diagnostics, null, 2));
