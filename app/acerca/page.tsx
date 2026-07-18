import type { Metadata } from "next";
import { renderMdx } from "@/lib/mdx";
import { getStaticPage } from "@/lib/pages";

/**
 * /acerca (T13) — página suelta desde content/pages/acerca.mdx.
 * Misma asimetría que la home (columna desplazada), prosa a medida 70ch.
 * Sin drop cap: arranca con un saludo corto y la capitular quedaría rara.
 */

const page = getStaticPage("acerca");

export const metadata: Metadata = {
  title: page.title,
  alternates: { canonical: "/acerca" },
};

export default async function AcercaPage() {
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
