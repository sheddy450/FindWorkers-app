import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

/** Lets search engines crawl public pages and points them at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      // APIs and signed-in areas: nothing useful for search, and they redirect to login anyway.
      disallow: ["/api/", "/admin", "/artisan/", "/requests", "/messages", "/profile", "/notifications", "/report", "/design", "/reset-password", "/forgot-password"],
    }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
