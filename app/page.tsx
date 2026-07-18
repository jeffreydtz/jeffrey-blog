import { PostLink } from "@/components/ui/PostLink";
import { getAllPosts } from "@/lib/posts";
import { formatDate, ui } from "@/lib/ui";

/**
 * Home (T12) — índice editorial: la tapa del blog es su tabla de contenidos.
 * Grid asimétrico (DESIGN.md): columna angosta de metadata a la izquierda
 * (folio + fecha + lectura + idioma), columna ancha de título + excerpt a la
 * derecha. Separación por hairline, cero cards. El folio numera las entradas
 * como un índice de libro (01, 02…) en micro/Fraunces.
 */
export default function HomePage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto w-full max-w-page px-lg">
      <section className="py-2xl sm:py-3xl">
        <h1 className="label">{ui.home.latest}</h1>
        <ol className="mt-lg">
          {posts.map((post, index) => (
            <li key={post.slug} className={index > 0 ? "hairline" : undefined}>
              <article className="grid gap-x-lg gap-y-sm py-xl sm:grid-cols-[minmax(10rem,13rem)_1fr]">
                <div className="flex flex-row flex-wrap items-baseline gap-x-md gap-y-xs sm:flex-col">
                  <p
                    aria-hidden="true"
                    className="font-display text-micro text-ink-muted"
                    data-tnum
                  >
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <time className="label block" dateTime={post.published_at}>
                    {formatDate(post.published_at, post.lang)}
                  </time>
                  <p className="label" data-tnum>
                    {post.readingTimeMinutes} {ui.post.readingTime} ·{" "}
                    <span lang={post.lang}>{post.lang}</span>
                  </p>
                </div>
                <div lang={post.lang}>
                  <h2 className="font-display text-display-md">
                    <PostLink
                      href={`/posts/${post.slug}`}
                      className="link-underline weight-hover text-ink"
                    >
                      {post.title}
                    </PostLink>
                  </h2>
                  <p className="mt-sm max-w-prose text-body-sm text-ink-muted">
                    {post.excerpt}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
