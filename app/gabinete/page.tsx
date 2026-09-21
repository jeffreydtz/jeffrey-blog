import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/i18n/metadata";
import type { Metadata } from "next";
import { ReadingShelf } from "@/components/reading/ReadingShelf";
import { CabinetChannel } from "@/components/ui/CabinetChannel";
import { getLibrary } from "@/lib/goodreads";
import { goodreadsReadShelfUrl } from "@/lib/library-data";
import { renderMdx } from "@/lib/mdx";
import { getStaticPage, getPageLocales } from "@/lib/pages";
import { toReadingBooks } from "@/lib/reading-books";
import { formatDate } from "@/lib/ui";

/**
 * /gabinete — curaduría (MDX) + estante Leído de Goodreads.
 * El estante es el paquete Astra ReadingShelf, a sangre, bajo el chrome del sitio.
 */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, ui } = await getI18n();
  const page = getStaticPage("gabinete", locale);
  return pageMetadata(
    "/gabinete",
    locale,
    page.title,
    ui.pages.cabinetDescription,
    page.lang,
    getPageLocales("gabinete"),
  );
}

export default async function GabinetePage() {
  const { locale, ui } = await getI18n();
  const page = getStaticPage("gabinete", locale);

  const [body, library] = await Promise.all([
    renderMdx(page.content),
    getLibrary(),
  ]);
  const books = toReadingBooks(library.books);

  return (
    <>
      <div className="mx-auto w-full max-w-page px-lg">
        <div className="pt-2xl sm:pt-3xl sm:pl-[14%]">
          <h1
            lang={page.lang}
            className="font-display text-display-lg text-ink"
          >
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
                {formatDate(library.verifiedAt, locale)}
              </time>
            </p>
          ) : null}
          <CabinetChannel />
          <article lang={page.lang} className="prose-blog mt-2xl">
            {page.lang !== locale && (
              <p role="note" lang={locale}>
                {ui.translationUnavailable}
              </p>
            )}
            {body}
          </article>
        </div>
      </div>
    </>
  );
}
