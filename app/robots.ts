import type { MetadataRoute } from "next";

// The entire platform is off-limits to crawlers. These are private
// demonstration surfaces, never meant to be indexed for any tenant.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
