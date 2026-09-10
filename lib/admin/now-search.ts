import "server-only";
import type { BookHit, SongHit } from "@/types/now-search";

/**
 * Búsqueda de canciones (iTunes) y libros (OpenLibrary) para el picker de
 * /admin/now. Mismas fuentes públicas que lib/now-covers.ts, sin API key.
 * Vive acá (no en el cliente) para evitar CORS y no exponer el fetch.
 */

const TIMEOUT_MS = 10_000;
const LIMIT = 8;
const UA =
  "jeffrey-blog-admin/1.0 (https://github.com/jeffreydtz/jeffrey-blog)";

interface ItunesResponse {
  results?: Array<{
    trackId?: number;
    trackName?: string;
    artistName?: string;
    collectionName?: string;
    artworkUrl100?: string;
  }>;
}

interface OpenLibraryResponse {
  docs?: Array<{
    key?: string;
    title?: string;
    subtitle?: string;
    author_name?: string[];
    cover_i?: number;
    first_publish_year?: number;
  }>;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
    headers: { accept: "application/json", "user-agent": UA },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function itunesArtwork(url: string, size: 100 | 300): string {
  return url.replace("100x100", `${size}x${size}`);
}

function openLibraryCover(coverId: number, size: "S" | "M"): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export async function searchSongs(query: string): Promise<SongHit[]> {
  const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${LIMIT}`;
  const body = (await fetchJson(endpoint)) as ItunesResponse;
  const hits: SongHit[] = [];
  for (const row of body.results ?? []) {
    if (!row.trackName || !row.artistName || !row.artworkUrl100) continue;
    hits.push({
      id: String(row.trackId ?? `${row.artistName}-${row.trackName}`),
      title: row.trackName,
      artist: row.artistName,
      album: row.collectionName ?? "",
      artwork: itunesArtwork(row.artworkUrl100, 300),
      thumb: itunesArtwork(row.artworkUrl100, 100),
    });
  }
  return hits;
}

export async function searchBooks(query: string): Promise<BookHit[]> {
  const endpoint = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${LIMIT}&fields=key,title,subtitle,author_name,cover_i,first_publish_year`;
  const body = (await fetchJson(endpoint)) as OpenLibraryResponse;
  const hits: BookHit[] = [];
  for (const doc of body.docs ?? []) {
    const title = doc.title?.trim();
    const author = (doc.author_name ?? []).filter(Boolean).join(", ");
    if (!title || !author || !doc.key) continue;
    const fullTitle = doc.subtitle ? `${title}: ${doc.subtitle}` : title;
    hits.push({
      id: doc.key,
      title: fullTitle,
      author,
      year:
        typeof doc.first_publish_year === "number"
          ? doc.first_publish_year
          : null,
      cover: doc.cover_i ? openLibraryCover(doc.cover_i, "M") : null,
      thumb: doc.cover_i ? openLibraryCover(doc.cover_i, "S") : null,
    });
  }
  return hits;
}
