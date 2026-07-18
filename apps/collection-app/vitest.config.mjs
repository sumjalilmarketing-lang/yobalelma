import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const appDir = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = path.resolve(appDir, "../..");
export default defineConfig({
  root: appDir,
  resolve: { alias: { "@collection-app": appDir, "@": workspaceRoot } },
  server: { fs: { allow: [workspaceRoot], strict: true } },
  test: { environment: "node", include: ["tests/**/*.test.ts"], exclude: ["**/tests/e2e/**"] },
});
