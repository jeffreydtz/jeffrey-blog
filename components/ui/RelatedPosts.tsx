import { PostLink } from "@/components/ui/PostLink";
import { formatDate, ui } from "@/lib/ui";
import type { Post } from "@/types/post";

/**
 * Relacionados (T12) — hasta 3 posts por tags compartidos (lib/posts.ts).
 * Sección entera desaparece si no hay ninguno: nada de secciones vacías.
 * Título + fecha, tipografía sola — sin cards.
 */
export function RelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="print-hidden mt-2xl" aria-label={ui.post.related}>
      <h2 className="label">{ui.post.related}</h2>
      <ul className="mt-md">
        {posts.map((post) => (
          <li
            key={post.slug}
            className="flex flex-wrap items-baseline gap-x-md gap-y-2xs py-sm"
            lang={post.lang}
          >
            <PostLink
              href={`/posts/${post.slug}`}
              className="link-underline weight-hover font-display text-display-sm text-ink"
            >
              {post.title}
            </PostLink>
            <time className="label" dateTime={post.published_at}>
              {formatDate(post.published_at, post.lang)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
