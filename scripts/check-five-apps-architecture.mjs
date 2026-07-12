import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const apps = [
  "user-app",
  "hub-app",
  "collection-app",
  "relay-app",
  "admin-app",
];

const packages = [
  "ui",
  "auth",
  "database",
  "types",
  "validation",
  "business-rules",
  "tracking",
  "qr",
  "notifications",
  "config",
];

const requiredDocs = [
  "docs/FIVE_APPS_AUDIT.md",
  "docs/FIVE_APPS_ARCHITECTURE.md",
  "docs/FIVE_APPS_MIGRATION_PLAN.md",
  "docs/ROUTE_CLASSIFICATION.md",
  "docs/DEPLOYMENT_PLAN.md",
  "docs/ACCESS_CONTROL_MATRIX.md",
];

function assertExists(relativePath) {
  if (!existsSync(path.join(process.cwd(), relativePath))) {
    throw new Error(`Missing required monorepo artifact: ${relativePath}`);
  }
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(process.cwd(), relativePath), "utf8"));
}

function main() {
  const requestedApp = process.argv[2];

  if (requestedApp && !apps.includes(requestedApp)) {
    throw new Error(`Unknown app: ${requestedApp}`);
  }

  const checkedApps = requestedApp ? [requestedApp] : apps;

  for (const app of checkedApps) {
    assertExists(`apps/${app}/package.json`);
    assertExists(`apps/${app}/README.md`);
    assertExists(`apps/${app}/src/manifest.ts`);
  }

  for (const packageName of packages) {
    assertExists(`packages/${packageName}/package.json`);
    assertExists(`packages/${packageName}/src/index.ts`);
  }

  for (const doc of requiredDocs) {
    assertExists(doc);
  }

  const rootPackage = readJson("package.json");

  if (!Array.isArray(rootPackage.workspaces)) {
    throw new Error("Root package.json must declare npm workspaces.");
  }

  console.log(
    JSON.stringify(
      {
        apps: checkedApps,
        docs: requiredDocs.length,
        ok: true,
        packages: packages.length,
        workspaces: rootPackage.workspaces,
      },
      null,
      2,
    ),
  );
}

main();
