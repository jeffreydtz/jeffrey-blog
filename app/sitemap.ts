import type { MetadataRoute } from "next";
import { getAllPosts, getPostLocales } from "@/lib/posts";
import { getPageLocales, type StaticPageSlug } from "@/lib/pages";
import { SITE } from "@/lib/site";
import { locales, localizedPath } from "@/lib/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const latest = posts[0]?.updated_at ?? posts[0]?.published_at;
  const routes = [
    "/",
    "/archivo",
    "/gabinete",
    "/vinyl",
    "/acerca",
    "/colofon",
  ];
  const entries: MetadataRoute.Sitemap = [];
  for (const route of routes) {
    const available = ["/gabinete", "/acerca", "/colofon"].includes(route)
      ? getPageLocales(route.slice(1) as StaticPageSlug)
      : locales;
    const languages = Object.fromEntries(
      available.map((locale) => [
        locale,
        `${SITE.url}${localizedPath(route, locale)}`,
      ]),
    );
    for (const locale of available)
      entries.push({
        url: languages[locale],
        lastModified: latest,
        alternates: { languages },
      });
  }
  for (const post of posts) {
    const available = getPostLocales(post.slug);
    const languages = Object.fromEntries(
      available.map((locale) => [
        locale,
        `${SITE.url}${localizedPath(`/posts/${post.slug}`, locale)}`,
      ]),
    );
    for (const locale of available)
      entries.push({
        url: languages[locale],
        lastModified: post.updated_at ?? post.published_at,
        alternates: { languages },
      });
  }
  return entries;
}
