import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { localizedPath, type Locale } from "./routing";
export function alternates(
  path: string,
  locale: Locale,
  available: readonly Locale[] = ["es", "en"],
): Metadata["alternates"] {
  return {
    canonical: localizedPath(path, locale),
    languages: Object.fromEntries([
      ...available.map((lang) => [lang, localizedPath(path, lang)]),
      ["x-default", localizedPath(path, available[0] ?? "es")],
    ]),
    types: { "application/rss+xml": `/feeds/${locale}` },
  };
}
export function pageMetadata(
  path: string,
  locale: Locale,
  title: string,
  description: string,
  contentLocale: Locale = locale,
  available: readonly Locale[] = ["es", "en"],
): Metadata {
  return {
    title,
    description,
    alternates: {
      ...alternates(path, locale, available),
      canonical: localizedPath(path, contentLocale),
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: localizedPath(path, contentLocale),
      siteName: SITE.name,
      locale: contentLocale === "es" ? "es_AR" : "en_US",
      alternateLocale: available
        .filter((lang) => lang !== contentLocale)
        .map((lang) => (lang === "es" ? "es_AR" : "en_US")),
      images: [`/${locale}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/${locale}/opengraph-image`],
    },
  };
}
