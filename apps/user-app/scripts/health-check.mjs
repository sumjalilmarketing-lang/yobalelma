const target = process.env.USER_APP_HEALTH_URL ?? "http://127.0.0.1:43121/api/health";
const response = await fetch(target);
if (!response.ok) {
  throw new Error(`Health check failed: ${response.status}`);
}
console.log(await response.text());
