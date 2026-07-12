import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security/headers";

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
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
