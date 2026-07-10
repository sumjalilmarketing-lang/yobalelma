const EXPECTED_SUPABASE_URL = "https://rgcgtcycbiuhcaoaadbh.supabase.co";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
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
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.error(
      JSON.stringify(
        {
          error: "Missing required environment variables.",
          missing,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
    projectUrl: EXPECTED_SUPABASE_URL,
    tables,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!auth.ok || !tables.ok || !buckets.ok) {
    process.exitCode = 1;
  }
}

await main();
