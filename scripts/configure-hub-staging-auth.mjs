import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const projectRef = "rgcgtcycbiuhcaoaadbh";
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;

loadEnvConfig(process.cwd(), false, { info: () => undefined, error: () => undefined });

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  throw new Error("Missing SUPABASE_ACCESS_TOKEN.");
}

const stagingUrl = new URL(process.argv[2]);
if (stagingUrl.protocol !== "https:") {
  throw new Error("The Hub staging URL must use HTTPS.");
}

const headers = {
  Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};

const currentResponse = await fetch(endpoint, { headers });
if (!currentResponse.ok) {
  throw new Error(`Unable to read Supabase Auth config (${currentResponse.status}).`);
}

const current = await currentResponse.json();
const callbackUrls = [
  stagingUrl.origin,
  `${stagingUrl.origin}/auth/sign-in`,
  `${stagingUrl.origin}/auth/callback`,
  `${stagingUrl.origin}/auth/reset-password`,
];
const existing = String(current.uri_allow_list ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const uriAllowList = [...new Set([...existing, ...callbackUrls])].join(",");

const updateResponse = await fetch(endpoint, {
  body: JSON.stringify({
    site_url: stagingUrl.origin,
    uri_allow_list: uriAllowList,
  }),
  headers,
  method: "PATCH",
});

if (!updateResponse.ok) {
  throw new Error(`Unable to update Supabase Auth config (${updateResponse.status}).`);
}

const updated = await updateResponse.json();
console.log(JSON.stringify({
  callbackCount: String(updated.uri_allow_list ?? "").split(",").filter(Boolean).length,
  projectRef,
  siteUrl: updated.site_url,
  stagingCallbacksConfigured: callbackUrls.every((url) => String(updated.uri_allow_list ?? "").includes(url)),
}, null, 2));
