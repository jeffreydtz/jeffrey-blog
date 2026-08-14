import { ui } from "@/lib/ui";

/**
 * Identidad del sitio — fuente única (T12/T15). La consumen metadata,
 * RSS, sitemap, robots y las OG images. La URL canónica sale de env
 * (NEXT_PUBLIC_SITE_URL) con fallback al dominio de Vercel.
 */
export const SITE = {
  name: ui.siteTitle,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://jeffrey-blog-tau.vercel.app",
  author: "Jeffrey Dietz",
  description: ui.siteDescription,
} as const;
