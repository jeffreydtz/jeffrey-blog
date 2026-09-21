import { getLocale } from "@/lib/i18n/server";
import { notFound } from "next/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { getPostBySlug } from "@/lib/posts";
import { SITE } from "@/lib/site";
import { formatDate } from "@/lib/ui";

/** Tarjeta social del artículo, localizada por el prefijo de la URL. */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = SITE.name;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug, await getLocale());
  if (!post) notFound();

  return renderOgImage({
    eyebrow: SITE.name,
    title: post.title,
    footer: `${formatDate(post.published_at, post.lang)} · ${SITE.author}`,
  });
}
