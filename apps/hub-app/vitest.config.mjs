import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const appDir = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = path.resolve(appDir, "../..");

export default defineConfig({
  plugins: [react()],
  root: appDir,
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
    globals: false,
  },
  resolve: {
    alias: {
      "server-only": path.resolve(appDir, "tests/server-only.ts"),
      "@": workspaceRoot,
      "@hub-app": appDir,
    },
  },
  server: {
    fs: {
      allow: [workspaceRoot],
      strict: true,
    },
  },
});
