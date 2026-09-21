import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/i18n/metadata";
import type { Metadata } from "next";
import { renderMdx } from "@/lib/mdx";
import { getStaticPage, getPageLocales } from "@/lib/pages";

/**
 * /colofon (T13) — la página que cuenta cómo está hecho el sitio,
 * desde content/pages/colofon.mdx. Mismo tratamiento que /acerca.
 */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, ui } = await getI18n();
  const page = getStaticPage("colofon", locale);
  return pageMetadata(
    "/colofon",
    locale,
    page.title,
    ui.pages.colophonDescription,
    page.lang,
    getPageLocales("colofon"),
  );
}

export default async function ColofonPage() {
  const { locale, ui } = await getI18n();
  const page = getStaticPage("colofon", locale);

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
