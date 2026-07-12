import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const EXPECTED_SUPABASE_URL = "https://rgcgtcycbiuhcaoaadbh.supabase.co";
const BUCKETS = [
  "avatars",
  "shipment-images",
  "kyc-documents",
  "flight-tickets",
  "proof-of-delivery",
  "dispute-evidence",
  "hub-inspection-images",
  "hub-incident-evidence",
  "batch-documents",
  "handover-proofs",
];

function redactError(error) {
  const message = error instanceof Error ? error.message : String(error);

  return message
    .replace(/sbp_[A-Za-z0-9_-]+/g, "sbp_[redacted]")
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, "sb_secret_[redacted]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "jwt_[redacted]");
}

function serviceHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
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

async function main() {
  loadEnvConfig(process.cwd(), false, { info: () => undefined, error: () => undefined });

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (baseUrl !== EXPECTED_SUPABASE_URL) {
    throw new Error("Unexpected Supabase URL for Yobalelma.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  const existingResult = await fetchJson(`${baseUrl}/storage/v1/bucket`, {
    headers: serviceHeaders(serviceRoleKey),
  });

  if (!existingResult.ok || !Array.isArray(existingResult.body)) {
    throw new Error(`Unable to list Storage buckets. Status ${existingResult.status}.`);
  }

  const existing = new Set(existingResult.body.map((bucket) => bucket.name ?? bucket.id));
  const created = [];
  const alreadyPresent = [];

  for (const bucket of BUCKETS) {
    if (existing.has(bucket)) {
      alreadyPresent.push(bucket);
      continue;
    }

    const createResult = await fetchJson(`${baseUrl}/storage/v1/bucket`, {
      body: JSON.stringify({
        allowed_mime_types: null,
        file_size_limit: null,
        id: bucket,
        name: bucket,
        public: false,
      }),
      headers: serviceHeaders(serviceRoleKey),
      method: "POST",
    });

    if (!createResult.ok && createResult.status !== 409) {
      throw new Error(`Unable to create Storage bucket ${bucket}. Status ${createResult.status}.`);
    }

    created.push(bucket);
  }

  console.log(
    JSON.stringify(
      {
        alreadyPresent,
        created,
        privateBucketsChecked: BUCKETS.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(redactError(error));
  process.exitCode = 1;
});
