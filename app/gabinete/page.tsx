import type { Metadata } from "next";
import { renderMdx } from "@/lib/mdx";
import { getStaticPage } from "@/lib/pages";
import { getLibrary } from "@/lib/goodreads";
import { ui, formatDate } from "@/lib/ui";
import { BookShelf } from "@/components/three/BookShelf";
import { CabinetChannel } from "@/components/ui/CabinetChannel";

/**
 * /gabinete — gabinete de curiosidades: curaduría manual de lo que se mira
 * y lo que se lee (vlogs, videos, artículos, libros). Contenido en
 * content/pages/gabinete.mdx, con los componentes MDX de la casa
 * (<YouTube caption>, <LinkCard>, …). Misma asimetría que /acerca.
 */

const page = getStaticPage("gabinete");

export const metadata: Metadata = {
  title: page.title,
  alternates: { canonical: "/gabinete" },
};

export default async function GabinetePage() {
  const [body, library] = await Promise.all([
    renderMdx(page.content),
    getLibrary(),
  ]);

  return (
    <div className="mx-auto w-full max-w-page px-lg">
      <div className="py-2xl sm:py-3xl sm:pl-[14%]">
        <h1 className="font-display text-display-lg text-ink">{page.title}</h1>
        <section className="mt-xl" aria-labelledby="library-title">
          <h2
            id="library-title"
            className="font-display text-display-md text-ink"
          >
            {ui.library.title}
          </h2>
          <p className="mt-md max-w-prose text-ink-secondary">
            {ui.library.intro}
          </p>
          <a
            href={library.profileUrl}
            className="link-underline inline-flex min-h-[var(--control-target)] items-center text-body-sm text-ink-secondary"
          >
            {ui.library.profile}
          </a>
          <BookShelf books={library.books} />
          {library.verifiedAt ? (
            <p className="mt-md text-body-sm text-ink-secondary">
              {ui.library.verified}:{" "}
              <time dateTime={library.verifiedAt}>
                {formatDate(library.verifiedAt)}
              </time>
            </p>
          ) : null}
        </section>
        <CabinetChannel />
        <article className="prose-blog mt-2xl">{body}</article>
      </div>
    </div>
  );
}
