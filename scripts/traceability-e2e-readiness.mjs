import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd(), false, { info: () => undefined, error: () => undefined });
const productionRef = "rgcgtcycbiuhcaoaadbh";
const baseUrl = process.env.PLAYWRIGHT_BASE_URL || process.env.E2E_BASE_URL || "";
const stagingRef = process.env.TRACEABILITY_STAGING_PROJECT_REF || "";
const requiredRoles = [
  "CLIENT_SENDER",
  "CLIENT_RECIPIENT",
  "RELAY_ORIGIN",
  "NATIONAL_DRIVER",
  "HUB_ORIGIN",
  "TRAVELER",
  "HUB_DESTINATION",
  "LAST_MILE_DRIVER",
  "RELAY_DESTINATION",
  "ADMIN",
];
const missing = [];
if (!baseUrl) missing.push("PLAYWRIGHT_BASE_URL or E2E_BASE_URL");
if (!stagingRef) missing.push("TRACEABILITY_STAGING_PROJECT_REF");
if (stagingRef === productionRef) missing.push("non-production project (production is forbidden)");
for (const role of requiredRoles) for (const suffix of ["EMAIL","PASSWORD"]) if (!process.env[`E2E_${role}_${suffix}`]) missing.push(`E2E_${role}_${suffix}`);
console.log(JSON.stringify({ ready: missing.length === 0, baseUrlConfigured: Boolean(baseUrl), stagingRef: stagingRef || null, productionRefForbidden: productionRef, requiredRoles, missing }, null, 2));
process.exitCode = process.argv.includes("--strict") && missing.length ? 2 : 0;
