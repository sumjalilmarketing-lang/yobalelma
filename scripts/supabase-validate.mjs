import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const PROJECT_REF = "rgcgtcycbiuhcaoaadbh";
const EXPECTED_SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const MANAGEMENT_API_BASE_URL = "https://api.supabase.com/v1";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const TABLES = [
  "profiles",
  "parcel_requests",
  "trips",
  "offers",
  "tracking_events",
  "role_assignments",
  "identity_verifications",
  "identity_verification_documents",
  "identity_verification_decisions",
  "shipments",
  "shipment_addresses",
  "shipment_packages",
  "shipment_status_events",
  "transporter_profiles",
  "transporter_vehicles",
  "transporter_zones",
  "transporter_availability",
  "local_delivery_missions",
  "relay_points",
  "relay_inventory",
  "relay_scan_events",
  "collection_routes",
  "collection_route_stops",
  "traveler_documents",
  "hub_batches",
  "capacity_reservations",
  "payment_intents",
  "payouts",
  "support_tickets",
  "support_messages",
  "audit_log_events",
  "platform_metrics_daily",
  "notifications",
  "platform_commissions",
  "delivery_proofs",
  "shipment_disputes",
  "pickup_requests",
  "handover_qr_tokens",
  "collection_manifests",
  "collection_manifest_items",
  "hub_package_inspections",
];

const BUCKETS = [
  "avatars",
  "shipment-images",
  "kyc-documents",
  "flight-tickets",
  "proof-of-delivery",
  "dispute-evidence",
  "hub-inspection-images",
];

function redactError(error) {
  if (error instanceof Error) {
    return error.message.replace(/[A-Za-z0-9_-]{20,}/g, "[redacted]");
  }

  return String(error).replace(/[A-Za-z0-9_-]{20,}/g, "[redacted]");
}

function serviceHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };
}

function managementHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return {
    body,
    ok: response.ok,
    status: response.status,
  };
}

function getKeyValue(candidate) {
  return (
    candidate.api_key ??
    candidate.key ??
    candidate.value ??
    candidate.secret ??
    candidate.token ??
    ""
  );
}

function findApiKey(apiKeys, names, prefixes) {
  if (!Array.isArray(apiKeys)) {
    return "";
  }

  const normalizedNames = names.map((name) => name.toLowerCase());
  const named = apiKeys.find((candidate) => {
    const candidateName = String(candidate.name ?? candidate.type ?? candidate.role ?? "")
      .toLowerCase()
      .replaceAll("-", "_");

    return normalizedNames.includes(candidateName);
  });

  const namedValue = named ? getKeyValue(named) : "";

  if (namedValue) {
    return namedValue;
  }

  const prefixed = apiKeys.find((candidate) => {
    const value = getKeyValue(candidate);

    return prefixes.some((prefix) => value.startsWith(prefix));
  });

  return prefixed ? getKeyValue(prefixed) : "";
}

async function resolveCredentials() {
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  const databaseUrlMissing = !process.env.DATABASE_URL;
  const directMissing = REQUIRED_ENV.filter((name) => !process.env[name]);

  if (!publishableKey) {
    directMissing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  if (databaseUrlMissing) {
    directMissing.push("DATABASE_URL");
  }

  if (directMissing.length === 0) {
    return {
      management: null,
      source: "environment",
      supabasePublishableKey: publishableKey,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (!accessToken) {
    return {
      error: "Missing required environment variables.",
      missing: [...directMissing, "SUPABASE_ACCESS_TOKEN"],
    };
  }

  if (databaseUrlMissing) {
    return {
      error: "Missing required environment variables.",
      missing: directMissing,
    };
  }

  const project = await fetchJson(`${MANAGEMENT_API_BASE_URL}/projects/${PROJECT_REF}`, {
    headers: managementHeaders(accessToken),
  });

  if (!project.ok) {
    return {
      error: "Unable to validate Supabase project with Management API.",
      managementStatus: project.status,
    };
  }

  const apiKeys = await fetchJson(`${MANAGEMENT_API_BASE_URL}/projects/${PROJECT_REF}/api-keys`, {
    headers: managementHeaders(accessToken),
  });

  if (!apiKeys.ok) {
    return {
      error: "Unable to fetch Supabase API keys with Management API.",
      managementStatus: apiKeys.status,
    };
  }

  const keys = Array.isArray(apiKeys.body)
    ? apiKeys.body
    : Array.isArray(apiKeys.body?.api_keys)
      ? apiKeys.body.api_keys
      : [];
  const supabaseAnonKey = findApiKey(
    keys,
    ["anon", "publishable", "publishable_key"],
    ["sb_publishable_", "eyJ"],
  );
  const serviceRoleKey = findApiKey(
    keys,
    ["service_role", "secret", "secret_key"],
    ["sb_secret_", "eyJ"],
  );

  if (!supabaseAnonKey || !serviceRoleKey) {
    return {
      error: "Management API did not return both publishable/anon and secret/service keys.",
      keyNamesSeen: keys.map((key) => String(key.name ?? key.type ?? key.role ?? "unknown")),
      managementStatus: apiKeys.status,
    };
  }

  return {
    management: {
      apiKeysStatus: apiKeys.status,
      projectName: project.body?.name ?? null,
      projectStatus: project.body?.status ?? null,
      projectStatusCode: project.status,
    },
    source: "management-api",
    supabasePublishableKey: supabaseAnonKey,
    supabaseUrl: EXPECTED_SUPABASE_URL,
    serviceRoleKey,
  };
}

async function validateTables(baseUrl, serviceRoleKey) {
  const results = await Promise.all(
    TABLES.map(async (table) => {
      try {
        const result = await fetchJson(
          `${baseUrl}/rest/v1/${table}?select=*&limit=0`,
          {
            headers: {
              ...serviceHeaders(serviceRoleKey),
              Prefer: "count=exact",
            },
          },
        );

        return {
          ok: result.ok,
          status: result.status,
          table,
        };
      } catch (error) {
        return {
          error: redactError(error),
          ok: false,
          status: 0,
          table,
        };
      }
    }),
  );

  return {
    checked: results.length,
    failed: results.filter((result) => !result.ok),
    ok: results.every((result) => result.ok),
  };
}

async function validateBuckets(baseUrl, serviceRoleKey) {
  const result = await fetchJson(`${baseUrl}/storage/v1/bucket`, {
    headers: serviceHeaders(serviceRoleKey),
  });

  if (!result.ok || !Array.isArray(result.body)) {
    return {
      checked: 0,
      failed: BUCKETS,
      ok: false,
      status: result.status,
    };
  }

  const existing = new Set(result.body.map((bucket) => bucket.name ?? bucket.id));
  const missing = BUCKETS.filter((bucket) => !existing.has(bucket));

  return {
    checked: BUCKETS.length,
    failed: missing,
    ok: missing.length === 0,
    status: result.status,
  };
}

async function validateAuth(baseUrl, serviceRoleKey) {
  try {
    const result = await fetchJson(`${baseUrl}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: serviceHeaders(serviceRoleKey),
    });

    return {
      ok: result.ok,
      status: result.status,
    };
  } catch (error) {
    return {
      error: redactError(error),
      ok: false,
      status: 0,
    };
  }
}

async function main() {
  const credentials = await resolveCredentials();

  if (credentials.error) {
    console.error(
      JSON.stringify(
        credentials,
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  const { serviceRoleKey, source, supabaseUrl } = credentials;

  if (supabaseUrl !== EXPECTED_SUPABASE_URL) {
    console.error(
      JSON.stringify(
        {
          error: "Unexpected Supabase URL.",
          expected: EXPECTED_SUPABASE_URL,
          received: supabaseUrl,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  const [auth, tables, buckets] = await Promise.all([
    validateAuth(supabaseUrl, serviceRoleKey),
    validateTables(supabaseUrl, serviceRoleKey),
    validateBuckets(supabaseUrl, serviceRoleKey),
  ]);

  const summary = {
    auth,
    buckets,
    credentials: {
      management: credentials.management,
      source,
    },
    projectUrl: EXPECTED_SUPABASE_URL,
    tables,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!auth.ok || !tables.ok || !buckets.ok) {
    process.exitCode = 1;
  }
}

loadEnvConfig(process.cwd());

await main();
