import type { Metadata } from "next";
import { renderMdx } from "@/lib/mdx";
import { getStaticPage } from "@/lib/pages";

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
