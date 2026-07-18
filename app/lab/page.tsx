import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LabStage } from "@/app/lab/LabStage";
import { renderMdx } from "@/lib/mdx";
import { getPostBySlug } from "@/lib/posts";
import { formatDate, ui } from "@/lib/ui";

/**
 * /lab — playground dev-only del pergamino (T07/T08).
 * En build de producción `notFound()` corre en build time y la ruta queda
 * como 404 estático: no existe en el sitio publicado.
 */

export const metadata: Metadata = {
  title: ui.lab.title,
  robots: { index: false, follow: false },
};

const SAMPLE_SLUG = "el-lujo-de-lo-lento";

/*
 * Smoke de fase 4 (T09–T11): un MDX de laboratorio que pasa por renderMdx y
 * ejercita TODO el mapa de componentes — embeds, Tweet/LinkCard (cache en
 * .cache/embeds/), overrides tipográficos y Shiki. La <LinkCard> usa la misma
 * URL que el post en inglés: al renderizar /lab en dev queda precalentado el
 * cache que el build real va a leer. Contenido falso de laboratorio, no UI.
 */
const MDX_SHOWCASE = `
## Overrides tipográficos

Un párrafo con [un link externo](https://developer.mozilla.org/) que abre en
pestaña nueva, [uno interno](/lab) y \`código inline\` con su tinte sutil.

### Bloque de código (Shiki, dual theme)

\`\`\`ts
interface Post {
  slug: string;
  publishedAt: string; // ISO
}

// El último post publicado, o null si no hay ninguno.
export function latest(posts: Post[]): Post | null {
  return posts[0] ?? null;
}
\`\`\`

> Una cita editorial: margen generoso, filete de un píxel, ninguna itálica
> forzada. La contención es el énfasis.

---

<YouTube id="ZXsQAXx_ao0" />

<Vimeo id="76979871" />

<Spotify id="0Hs3BomCdwIWRhgT57x22T" kind="album" compact />

<SoundCloud url="https://soundcloud.com/forss/flickermood" />

<Bandcamp album="2721182898" />

<Tweet id="20" />

<LinkCard url="https://en.wikipedia.org/wiki/IndieWeb" />
`;

/* Relleno largo para probar el parallax y el borde inferior del rollo con
   scroll real. Contenido falso de laboratorio, no UI. */
const LOREM = Array.from(
  { length: 10 },
  () =>
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod " +
    "tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim " +
    "veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea " +
    "commodo consequat. Duis aute irure dolor in reprehenderit in voluptate " +
    "velit esse cillum dolore eu fugiat nulla pariatur.",
);

export default async function LabPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const post = getPostBySlug(SAMPLE_SLUG);
  if (!post) notFound();
  const body = await renderMdx(post.content);
  const showcase = await renderMdx(MDX_SHOWCASE);

  return (
    <>
      <LabStage
        header={
          <header className="mb-2xl">
            <p className="label">
              {ui.post.published} —{" "}
              <time dateTime={post.published_at}>
                {formatDate(post.published_at, post.lang)}
              </time>
            </p>
            <h1 className="mt-md font-display text-display-xl text-ink">
              {post.title}
            </h1>
            <p className="mt-sm text-body-sm text-ink-muted">
              {post.readingTimeMinutes} {ui.post.readingTime}
            </p>
          </header>
        }
      >
        <article className="prose-blog drop-cap">{body}</article>
        <div className="hairline mt-3xl" />
        <div className="prose-blog mt-2xl pb-3xl text-ink-secondary">
          {LOREM.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </LabStage>
      <section className="mx-auto w-full max-w-page px-lg pb-3xl">
        <div className="hairline mb-2xl" />
        <p className="label">{ui.lab.embedsTitle}</p>
        <p className="mt-2xs text-body-sm text-ink-muted">
          {ui.lab.embedsSubtitle}
        </p>
        <article className="prose-blog mt-xl">{showcase}</article>
      </section>
    </>
  );
}
