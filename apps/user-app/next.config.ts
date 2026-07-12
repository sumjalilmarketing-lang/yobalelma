import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import { securityHeaders } from "../../lib/security/headers";

const workspaceRoot = path.resolve(process.cwd(), "../..");

loadEnvConfig(workspaceRoot);

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [...securityHeaders],
        source: "/:path*",
      },
    ];
  },
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    externalDir: true,
  },
  outputFileTracingRoot: workspaceRoot,
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
