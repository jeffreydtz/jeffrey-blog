import { translatedContent } from "@/lib/i18n/content.mjs";
import type { Locale } from "@/lib/i18n/routing";
import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const PAGES_DIR = path.join(process.cwd(), "content", "pages");

export type StaticPageSlug = "acerca" | "colofon" | "gabinete";

export interface StaticPage {
  title: string;
  lang: Locale;
  /** Cuerpo MDX sin frontmatter, listo para renderMdx. */
  content: string;
}

/**
 * Páginas sueltas (FR-001): content/pages/{acerca,colofon}.mdx.
 * Frontmatter mínimo validado en build — title requerido; sin title
 * el build falla (intencional, igual que lib/posts.ts).
 */
export function getStaticPage(
  slug: StaticPageSlug,
  locale: Locale = "es",
): StaticPage {
  const raw = fs.readFileSync(path.join(PAGES_DIR, `${slug}.mdx`), "utf8");
  const { data, content } = matter(raw);
  if (typeof data.title !== "string" || data.title.trim() === "") {
    throw new Error(`[pages] ${slug}.mdx: frontmatter "title" requerido`);
  }
  const translation =
    locale !== "es" ? translatedContent(raw, "pages", slug, locale) : null;
  return translation
    ? {
        title: String(translation.data.title),
        content: translation.content,
        lang: locale,
      }
    : { title: data.title, content, lang: "es" };
}

export function getPageLocales(slug: StaticPageSlug): Locale[] {
  return (["es", "en"] as const).filter(
    (locale) => getStaticPage(slug, locale).lang === locale,
  );
}
