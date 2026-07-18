import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

/**
 * /sitemap.xml (T15) — posts + rutas estáticas. lastModified de posts:
 * updated_at si existe, si no published_at. Las rutas estáticas usan la
 * fecha del post más reciente (última vez que el contenido del sitio cambió).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const latest =
    posts.length > 0
      ? (posts[0].updated_at ?? posts[0].published_at)
      : undefined;

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/archivo",
    "/acerca",
    "/colofon",
  ].map((route) => ({
    url: `${SITE.url}${route}`,
    lastModified: latest,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE.url}/posts/${post.slug}`,
    lastModified: post.updated_at ?? post.published_at,
  }));

  return [...staticRoutes, ...postRoutes];
}
