const port = Number(process.env.PORT ?? 43122);
const baseUrl = process.env.HEALTHCHECK_BASE_URL ?? `http://127.0.0.1:${port}`;

const response = await fetch(`${baseUrl}/api/health`);

if (!response.ok) {
  throw new Error(`Hub health check failed with ${response.status}.`);
}

const payload = await response.json();

if (payload.status !== "ok" || payload.app !== "hub-app") {
  throw new Error("Hub health check returned an invalid payload.");
}

console.log(JSON.stringify({ ok: true, app: payload.app, status: payload.status }));
