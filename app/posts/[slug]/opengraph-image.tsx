import { notFound } from "next/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { SITE } from "@/lib/site";
import { formatDate } from "@/lib/ui";

/**
 * OG image por post (T15) — misma tarjeta que la default, con el título del
 * ensayo y fecha · autor al pie. generateStaticParams propio: los archivos
 * de metadata image son rutas aparte y no heredan el del page.tsx — sin
 * esto la imagen quedaría dynamic (render on demand) en vez de build-time.
 */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = SITE.name;

export function generateStaticParams(): { slug: string }[] {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return renderOgImage({
    eyebrow: SITE.name,
    title: post.title,
    footer: `${formatDate(post.published_at, post.lang)} · ${SITE.author}`,
  });
}
