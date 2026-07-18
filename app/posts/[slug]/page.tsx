import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ScrollReveal } from "@/components/scroll/ScrollReveal";
import { PrevNext } from "@/components/ui/PrevNext";
import { Reactions } from "@/components/ui/Reactions";
import { RelatedPosts } from "@/components/ui/RelatedPosts";
import { renderMdx } from "@/lib/mdx";
import {
  getAdjacentPosts,
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/posts";
import { SITE } from "@/lib/site";
import { formatDate, ui } from "@/lib/ui";
import type { Post } from "@/types/post";

/**
 * Vista de post (T12) — SSG total: generateStaticParams + dynamicParams=false
 * (slug desconocido → 404 estático). RSC async: el MDX se compila en build.
 * ScrollReveal va keyed por slug: en navegación cliente (prev/next, related)
 * el wrapper se remonta y el pergamino se vuelve a desenrollar.
 */

interface Params {
  slug: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `/posts/${post.slug}`,
      siteName: SITE.name,
      locale: post.lang === "es" ? "es_AR" : "en_US",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: [SITE.author],
      tags: [...post.tags],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

/**
 * Cover opcional (FR-001: `cover_image?`). Los posts actuales no tienen —
 * sin cover no se renderiza nada. Local (public/): next/image con dimensiones
 * intrínsecas leídas en build (sin CLS), mismo criterio que MdxImage.
 */
function CoverImage({ post }: { post: Post }) {
  const src = post.cover_image;
  if (!src) return null;

  if (src.startsWith("/")) {
    const publicDir = path.join(process.cwd(), "public");
    const file = path.normalize(path.join(publicDir, src));
    if (!file.startsWith(publicDir + path.sep) || !fs.existsSync(file)) {
      throw new Error(`[posts] cover_image no encontrada: public${src}`);
    }
    const { width, height } = imageSize(fs.readFileSync(file));
    if (!width || !height) {
      throw new Error(`[posts] no pude leer dimensiones de public${src}`);
    }
    return (
      <Image
        src={src}
        alt={post.title}
        width={width}
        height={height}
        priority
        sizes="(max-width: 48rem) 100vw, 48rem"
        className="mb-2xl h-auto w-full rounded-subtle border border-hairline"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- cover remota de host arbitrario; sin remotePatterns comodín (ver MdxImage)
    <img
      src={src}
      alt={post.title}
      decoding="async"
      className="mb-2xl h-auto w-full rounded-subtle border border-hairline"
    />
  );
}

function PostHeader({ post }: { post: Post }) {
  return (
    <header className="mb-2xl">
      <p className="label">
        {ui.post.published} —{" "}
        <time dateTime={post.published_at}>
          {formatDate(post.published_at, post.lang)}
        </time>{" "}
        · <span data-tnum>{post.readingTimeMinutes}</span> {ui.post.readingTime}
      </p>
      {post.updated_at !== undefined && (
        <p className="label mt-2xs">
          {ui.post.updated} —{" "}
          <time dateTime={post.updated_at}>
            {formatDate(post.updated_at, post.lang)}
          </time>
        </p>
      )}
      <h1 className="mt-md text-balance font-display text-display-xl text-ink">
        {post.title}
      </h1>
      {post.tags.length > 0 && (
        <ul aria-label={ui.post.tags} className="mt-lg flex flex-wrap gap-md">
          {post.tags.map((tag) => (
            <li key={tag} className="label">
              {tag}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

export default async function PostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const body = await renderMdx(post.content);
  const related = getRelatedPosts(post.slug);
  const { prev, next } = getAdjacentPosts(post.slug);

  /* JSON-LD Article (FR-007). Contenido propio del repo; el escape de "<"
     evita cierre de <script> por si un título lo incluyera. */
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    inLanguage: post.lang,
    datePublished: post.published_at,
    dateModified: post.updated_at ?? post.published_at,
    keywords: post.tags.join(", "),
    author: { "@type": "Person", name: SITE.author, url: SITE.url },
    mainEntityOfPage: `${SITE.url}/posts/${post.slug}`,
    url: `${SITE.url}/posts/${post.slug}`,
    image: `${SITE.url}/posts/${post.slug}/opengraph-image`,
  }).replace(/</g, "\\u003c");

  return (
    <div className="mx-auto w-full max-w-page px-lg py-xl" lang={post.lang}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />
      <ScrollReveal
        key={post.slug}
        header={<PostHeader post={post} />}
        className="mx-auto max-w-prose"
      >
        <CoverImage post={post} />
        <article className="prose-blog drop-cap">{body}</article>
        <div className="hairline mt-3xl" />
        {/* Fase 6 (T16): cierre del post — la marca, antes de Relacionados */}
        <Reactions slug={post.slug} />
        <RelatedPosts posts={related} />
        <PrevNext
          prev={prev && { slug: prev.slug, title: prev.title }}
          next={next && { slug: next.slug, title: next.title }}
        />
      </ScrollReveal>
    </div>
  );
}
