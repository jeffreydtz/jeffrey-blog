import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/i18n/metadata";
import type { Metadata } from "next";
import { renderMdx } from "@/lib/mdx";
import { getStaticPage, getPageLocales } from "@/lib/pages";

/**
 * /acerca (T13) — página suelta desde content/pages/acerca.mdx.
 * Misma asimetría que la home (columna desplazada), prosa a medida 70ch.
 * Sin drop cap: arranca con un saludo corto y la capitular quedaría rara.
 */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, ui } = await getI18n();
  const page = getStaticPage("acerca", locale);
  return pageMetadata(
    "/acerca",
    locale,
    page.title,
    ui.pages.aboutDescription,
    page.lang,
    getPageLocales("acerca"),
  );
}

export default async function AcercaPage() {
  const { locale, ui } = await getI18n();
  const page = getStaticPage("acerca", locale);

  const body = await renderMdx(page.content);

  return (
    <div className="mx-auto w-full max-w-page px-lg">
      <div className="py-2xl sm:py-3xl sm:pl-[14%]">
        <h1 lang={page.lang} className="font-display text-display-lg text-ink">
          {page.title}
        </h1>
        <article lang={page.lang} className="prose-blog mt-xl">
          {page.lang !== locale && (
            <p role="note" lang={locale}>
              {ui.translationUnavailable}
            </p>
          )}
          {body}
        </article>
      </div>
    </div>
  );
}
