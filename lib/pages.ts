import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const PAGES_DIR = path.join(process.cwd(), "content", "pages");

export type StaticPageSlug = "acerca" | "colofon" | "gabinete";

export interface StaticPage {
  title: string;
  /** Cuerpo MDX sin frontmatter, listo para renderMdx. */
  content: string;
}

/**
 * Páginas sueltas (FR-001): content/pages/{acerca,colofon}.mdx.
 * Frontmatter mínimo validado en build — title requerido; sin title
 * el build falla (intencional, igual que lib/posts.ts).
 */
export function getStaticPage(slug: StaticPageSlug): StaticPage {
  const raw = fs.readFileSync(path.join(PAGES_DIR, `${slug}.mdx`), "utf8");
  const { data, content } = matter(raw);
  if (typeof data.title !== "string" || data.title.trim() === "") {
    throw new Error(`[pages] ${slug}.mdx: frontmatter "title" requerido`);
  }
  return { title: data.title, content };
}
