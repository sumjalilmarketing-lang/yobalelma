import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pilotAccounts, pilotApplications } from "./pilot-account-catalog.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const directory = path.join(root, ".pilot-access");
const filePath = path.join(directory, "credentials.json");
await mkdir(directory, { recursive: true });
let existing = { accounts: [] };
try { existing = JSON.parse(await readFile(filePath, "utf8")); } catch {}
const previous = new Map((existing.accounts ?? []).map((item) => [item.email, item.temporaryPassword]));
const accounts = pilotAccounts.map((item) => ({
  ...item,
  signInUrl: pilotApplications[item.application].signInUrl,
  temporaryPassword: previous.get(item.email) ?? strongPassword(),
  passwordChangeRequired: true,
}));
await writeFile(filePath, `${JSON.stringify({ generatedAt: new Date().toISOString(), accounts }, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
console.log(JSON.stringify({ ok: true, file: ".pilot-access/credentials.json", accounts: accounts.length, uniquePasswords: new Set(accounts.map((item) => item.temporaryPassword)).size }));

function strongPassword() {
  return `Yb!${randomBytes(18).toString("base64url")}9a#`;
}
