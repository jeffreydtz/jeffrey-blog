import type { Metadata } from "next";
import { PostLink } from "@/components/ui/PostLink";
import { getPostsByYear } from "@/lib/posts";
import { formatDate, ui } from "@/lib/ui";

/**
 * Archivo (T13) — índice de biblioteca por año, descendente (2026, 2025…).
 * Grid asimétrico: el año como numeral grande en Fraunces en la columna
 * izquierda (portadilla de sección), los posts a la derecha con fecha .label.
 * Años separados por hairline.
 */

export const metadata: Metadata = {
  title: ui.nav.archive,
  alternates: { canonical: "/archivo" },
};

export default function ArchivePage() {
  const years = getPostsByYear();

  return (
    <div className="mx-auto w-full max-w-page px-lg">
      <div className="py-2xl sm:py-3xl">
        <h1 className="label">{ui.nav.archive}</h1>
        <div className="mt-lg">
          {years.map(({ year, posts }, index) => (
            <section
              key={year}
              className={index > 0 ? "hairline" : undefined}
              aria-label={String(year)}
            >
              <div className="grid gap-x-lg gap-y-md py-xl sm:grid-cols-[minmax(10rem,13rem)_1fr]">
                <h2 className="font-display text-display-lg text-ink" data-tnum>
                  {year}
                </h2>
                <ul>
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
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
