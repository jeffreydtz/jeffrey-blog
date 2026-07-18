import { getAllPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

/**
 * /rss.xml (T15, FR-002) — RSS 2.0 completo, XML a mano con escape propio:
 * sin dependencias. Estático: se genera en build (force-static).
 * El idioma del canal es el del sitio (es); cada item declara el suyo
 * vía dc:language (RSS 2.0 no tiene <language> por item).
 */

export const dynamic = "force-static";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toUTCString();
}

export function GET(): Response {
  const posts = getAllPosts();
  const lastBuildDate =
    posts.length > 0 ? rfc822(posts[0].published_at) : rfc822("1970-01-01");

  const items = posts
    .map((post) => {
      const url = `${SITE.url}/posts/${post.slug}`;
      const categories = post.tags
        .map((tag) => `      <category>${esc(tag)}</category>`)
        .join("\n");
      return `    <item>
      <title>${esc(post.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${rfc822(post.published_at)}</pubDate>
      <description>${esc(post.excerpt)}</description>
${categories}
      <dc:language>${post.lang}</dc:language>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(SITE.name)}</title>
    <link>${esc(SITE.url)}</link>
    <description>${esc(SITE.description)}</description>
    <language>es</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${esc(`${SITE.url}/rss.xml`)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
