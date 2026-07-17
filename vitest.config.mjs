import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: rootDir,
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
    globals: false,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "server-only": path.resolve(rootDir, "apps/hub-app/tests/server-only.ts"),
      "@": path.resolve(rootDir, "."),
    },
  },
  server: {
    fs: {
      allow: [rootDir],
      strict: true,
    },
  },
});
