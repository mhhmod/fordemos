import type { NextConfig } from "next";

// Every response carries a hard no-index directive. This is a demonstration
// surface: it must never be indexed by a search engine, for any tenant.
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
