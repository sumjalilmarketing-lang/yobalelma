import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadPilotCredentials(workspaceRoot) {
  const requested = process.env.YB_PILOT_CREDENTIALS_FILE;
  const filePath = requested ? path.resolve(requested) : path.join(workspaceRoot, ".pilot-access", "credentials.json");
  const payload = JSON.parse(await readFile(filePath, "utf8"));
  if (!Array.isArray(payload.accounts)) throw new Error("Pilot credential bundle is invalid.");
  return payload;
}

export function passwordFor(bundle, email) {
  const entry = bundle.accounts.find((item) => item.email === email);
  if (!entry?.temporaryPassword || entry.temporaryPassword.length < 18) throw new Error(`Missing strong pilot password for ${email}.`);
  return entry.temporaryPassword;
}
