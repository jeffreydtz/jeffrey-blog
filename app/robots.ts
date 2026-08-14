import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** /robots.txt (T15) — todo indexable salvo el panel /admin. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
