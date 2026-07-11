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
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
