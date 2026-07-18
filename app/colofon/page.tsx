import type { Metadata } from "next";
import { renderMdx } from "@/lib/mdx";
import { getStaticPage } from "@/lib/pages";

/**
 * /colofon (T13) — la página que cuenta cómo está hecho el sitio,
 * desde content/pages/colofon.mdx. Mismo tratamiento que /acerca.
 */

const page = getStaticPage("colofon");

export const metadata: Metadata = {
  title: page.title,
  alternates: { canonical: "/colofon" },
};

export default async function ColofonPage() {
  const body = await renderMdx(page.content);

  return (
    <div className="mx-auto w-full max-w-page px-lg">
      <div className="py-2xl sm:py-3xl sm:pl-[14%]">
        <h1 className="font-display text-display-lg text-ink">{page.title}</h1>
        <article className="prose-blog mt-xl">{body}</article>
      </div>
    </div>
  );
}
