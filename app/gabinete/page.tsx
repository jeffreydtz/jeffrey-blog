import type { Metadata } from "next";
import { ReadingShelf } from "@/components/reading/ReadingShelf";
import { CabinetChannel } from "@/components/ui/CabinetChannel";
import { getLibrary } from "@/lib/goodreads";
import { goodreadsReadShelfUrl } from "@/lib/library-data";
import { renderMdx } from "@/lib/mdx";
import { getStaticPage } from "@/lib/pages";
import { toReadingBooks } from "@/lib/reading-books";
import { formatDate, ui } from "@/lib/ui";

/**
 * /gabinete — curaduría (MDX) + estante Leído de Goodreads.
 * El estante es el paquete Astra ReadingShelf, a sangre, bajo el chrome del sitio.
 */

const page = getStaticPage("gabinete");

export const metadata: Metadata = {
  title: page.title,
  description: ui.pages.cabinetDescription,
  alternates: { canonical: "/gabinete" },
};

export default async function GabinetePage() {
  const [body, library] = await Promise.all([
    renderMdx(page.content),
    getLibrary(),
  ]);
  const books = toReadingBooks(library.books);

  return (
    <>
      <div className="mx-auto w-full max-w-page px-lg">
        <div className="pt-2xl sm:pt-3xl sm:pl-[14%]">
          <h1 className="font-display text-display-lg text-ink">
            {page.title}
          </h1>
          <p className="mt-md max-w-prose text-ink-secondary">
            {ui.library.intro}
          </p>
        </div>
      </div>
      <ReadingShelf books={books} shelfUrl={goodreadsReadShelfUrl} />
      <div className="mx-auto w-full max-w-page px-lg">
        <div className="pb-2xl sm:pb-3xl sm:pl-[14%]">
          {library.verifiedAt ? (
            <p className="text-body-sm text-ink-secondary">
              {ui.library.verified}:{" "}
              <time dateTime={library.verifiedAt}>
                {formatDate(library.verifiedAt)}
              </time>
            </p>
          ) : null}
          <CabinetChannel />
          <article className="prose-blog mt-2xl">{body}</article>
        </div>
      </div>
    </>
  );
}
