import { PostLink } from "@/components/ui/PostLink";
import { formatDate } from "@/lib/ui";
import { getI18n } from "@/lib/i18n/server";
import type { Post } from "@/types/post";

/**
 * Relacionados (T12) — hasta 3 posts por tags compartidos (lib/posts.ts).
 * Sección entera desaparece si no hay ninguno: nada de secciones vacías.
 * Título + fecha, tipografía sola — sin cards.
 */
export async function RelatedPosts({ posts }: { posts: Post[] }) {
  const { locale, ui } = await getI18n();
  if (posts.length === 0) return null;

  return (
    <section className="print-hidden mt-2xl" aria-label={ui.post.related}>
      <h2 className="label">{ui.post.related}</h2>
      <ul className="mt-md">
        {posts.map((post) => (
          <li
            key={post.slug}
            className="flex flex-wrap items-baseline gap-x-md gap-y-2xs py-sm"
          >
            <PostLink
              href={`/posts/${post.slug}`}
              lang={post.lang}
              className="link-underline weight-hover font-display text-display-sm text-ink"
            >
              {post.title}
            </PostLink>
            <time className="label" dateTime={post.published_at}>
              {formatDate(post.published_at, locale)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
