import type { MetadataRoute } from "next";
import { siteUrl } from '@/lib/site';

// Shop pages are public; the dashboard and the API are not for search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
