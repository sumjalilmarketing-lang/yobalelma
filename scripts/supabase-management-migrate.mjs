import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const PROJECT_REF = "rgcgtcycbiuhcaoaadbh";
const MANAGEMENT_QUERY_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

function redact(text) {
  return text
    .replace(/postgres(?:ql)?:\/\/[^\s'"<>]+/gi, "postgresql://[redacted]")
    .replace(/sbp_[A-Za-z0-9_-]+/g, "sbp_[redacted]")
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, "sb_secret_[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "jwt_[redacted]");
}

async function runQuery(query) {
  const response = await fetch(MANAGEMENT_QUERY_URL, {
    body: JSON.stringify({ query }),
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`SQL query failed (${response.status}): ${redact(message)}`);
  }

  return body;
}

function migrationParts(fileName) {
  const match = fileName.match(/^(\d+)_(.+)\.sql$/);

  if (!match) {
    return null;
  }

  return {
    fileName,
    name: match[2],
    version: match[1],
  };
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function existingVersions() {
  const rows = await runQuery(
    "select version from supabase_migrations.schema_migrations order by version;",
  );

  return new Set(rows.map((row) => String(row.version)));
}

async function migrationColumns() {
  return await runQuery(
    "select column_name, data_type, is_nullable from information_schema.columns where table_schema = 'supabase_migrations' and table_name = 'schema_migrations' order by ordinal_position;",
  );
}

function migrationHistoryInsert({ columns, name, version }) {
  const columnNames = new Set(columns.map((column) => column.column_name));

  if (columnNames.has("statements")) {
    return [
      "insert into supabase_migrations.schema_migrations (version, name, statements)",
      `values (${sqlLiteral(version)}, ${sqlLiteral(name)}, array[]::text[])`,
      "on conflict (version) do nothing;",
    ].join("\n");
  }

  if (columnNames.has("name")) {
    return [
      "insert into supabase_migrations.schema_migrations (version, name)",
      `values (${sqlLiteral(version)}, ${sqlLiteral(name)})`,
      "on conflict (version) do nothing;",
    ].join("\n");
  }

  return [
    "insert into supabase_migrations.schema_migrations (version)",
    `values (${sqlLiteral(version)})`,
    "on conflict (version) do nothing;",
  ].join("\n");
}

async function applyMigration({ columns, fileName, name, version }) {
  const sql = await readFile(path.join(MIGRATIONS_DIR, fileName), "utf8");
  const historySql = migrationHistoryInsert({ columns, name, version });
  const wrappedSql = ["begin;", sql, historySql, "commit;"].join("\n\n");

  await runQuery(wrappedSql);
}

async function main() {
  loadEnvConfig(process.cwd(), false, { info: () => undefined, error: () => undefined });

  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    throw new Error("Missing SUPABASE_ACCESS_TOKEN.");
  }

  const mode = process.argv[2] ?? "apply";
  const columns = await migrationColumns();

  if (mode === "inspect") {
    console.log(JSON.stringify({ columns }, null, 2));
    return;
  }

  const existing = await existingVersions();
  const migrations = (await readdir(MIGRATIONS_DIR))
    .map(migrationParts)
    .filter(Boolean)
    .sort((left, right) => left.version.localeCompare(right.version));
  const pending = migrations.filter((migration) => !existing.has(migration.version));

  if (mode === "pending") {
    console.log(
      JSON.stringify(
        {
          pending: pending.map((migration) => migration.fileName),
          checked: migrations.length,
        },
        null,
        2,
      ),
    );
    return;
  }

  for (const migration of pending) {
    await applyMigration({ ...migration, columns });
  }

  console.log(
    JSON.stringify(
      {
        applied: pending.map((migration) => migration.fileName),
        checked: migrations.length,
        pendingBeforeApply: pending.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(redact(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
