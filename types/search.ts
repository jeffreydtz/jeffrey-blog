import type { PostLang } from "@/types/post";

/**
 * Contrato del índice de búsqueda (T14): lo emite
 * scripts/build-search-index.mjs en public/search-index.json y lo
 * consume el CommandPalette (Fuse.js) en el cliente.
 */
export interface SearchDoc {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  lang: PostLang;
  /** Fecha ISO (YYYY-MM-DD). */
  published_at: string;
  year: number;
}
