/**
 * Hits del buscador de /admin/now (proxy iTunes / OpenLibrary).
 * Sin API keys: las fuentes son públicas.
 */

export type NowSearchKind = "song" | "book";

export interface SongHit {
  id: string;
  title: string;
  artist: string;
  album: string;
  /** Artwork 300×300 para guardar en coverUrl. */
  artwork: string;
  /** Thumb 100×100 para la lista. */
  thumb: string;
}

export interface BookHit {
  id: string;
  title: string;
  author: string;
  year: number | null;
  cover: string | null;
  thumb: string | null;
}

export type NowSearchResponse =
  { kind: "song"; results: SongHit[] } | { kind: "book"; results: BookHit[] };
