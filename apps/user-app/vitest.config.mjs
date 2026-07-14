import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = configDir;
const rootDir = path.resolve(configDir, "../..");

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
