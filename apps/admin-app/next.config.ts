import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { securityHeaders } from "../../lib/security/headers";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(appRoot, "../..");
loadEnvConfig(workspaceRoot, process.env.NODE_ENV !== "production");

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }];
  },
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: { externalDir: true },
  outputFileTracingRoot: workspaceRoot,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
