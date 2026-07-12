import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const appDir = fileURLToPath(new URL(".", import.meta.url));
const rootDir = path.resolve(appDir, "../..");

export default defineConfig({
  plugins: [react()],
  root: appDir,
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**"],
    globals: false,
    setupFiles: [path.resolve(rootDir, "tests/setup.ts")]
  },
  resolve: {
    alias: {
      "@": rootDir,
      "@user-app": appDir
    }
  },
  server: {
    fs: {
      allow: [appDir, rootDir],
      strict: true
    }
  }
});
