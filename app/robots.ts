import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** /robots.txt (T15) — todo indexable, con referencia al sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
