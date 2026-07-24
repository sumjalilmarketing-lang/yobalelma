import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = path.resolve(appDir, "../..");
export default defineConfig({
  root: appDir,
  resolve: { alias: { "@admin-app": appDir, "@": workspaceRoot } },
  server: { fs: { allow: [workspaceRoot], strict: true } },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
