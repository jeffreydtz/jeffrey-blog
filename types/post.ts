/**
 * Contrato de frontmatter de posts (spec 001, FR-001).
 * Todo .mdx en content/posts/ debe cumplirlo; lib/posts.ts valida en build.
 */

export type PostLang = "es" | "en";

export interface PostFrontmatter {
  title: string;
  slug: string;
  excerpt: string;
  cover_image?: string;
  /** Fecha ISO (YYYY-MM-DD). */
  published_at: string;
  /** Fecha ISO (YYYY-MM-DD). */
  updated_at?: string;
  tags: string[];
  lang: PostLang;
  /** true → excluido de listados, feed, sitemap y build de producción. */
  draft?: boolean;
}

export interface Post extends PostFrontmatter {
  /** Cuerpo MDX sin frontmatter. */
  content: string;
  /** Calculado a ~200 palabras por minuto, mínimo 1. */
  readingTimeMinutes: number;
}

export interface AdjacentPosts {
  /** Post anterior en el tiempo (más viejo). */
  prev: Post | null;
  /** Post siguiente en el tiempo (más nuevo). */
  next: Post | null;
}

export interface YearGroup {
  year: number;
  posts: Post[];
}
