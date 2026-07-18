import "server-only";
import { readEmbedCache, writeEmbedCache } from "@/lib/embed-cache";
import { now } from "@/lib/now";

/**
 * Portadas del widget "Ahora" resueltas en build/render time (SSG), con la
 * misma disciplina de red que lib/oembed.ts / lib/og-scrape.ts: cache en
 * disco commiteado (`.cache/embeds/`); si hay valor cacheado se usa siempre;
 * sin cache + red caída o sin resultado → null y el widget renderiza
 * solo-texto. El build NUNCA falla por red.
 *
 * Fuentes (ambas públicas, sin API key):
 * - Canción: iTunes Search API → artworkUrl100, upscaled a 300x300.
 * - Libro: OpenLibrary Search → cover_i → covers.openlibrary.org (-M).
 */

export interface NowCovers {
  listening: string | null;
  reading: string | null;
}

const TIMEOUT_MS = 10_000;

interface CoverCacheData {
  url: string;
}

interface ItunesResponse {
  results?: { artworkUrl100?: string }[];
}

interface OpenLibraryResponse {
  docs?: { cover_i?: number }[];
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function lookupCover(
  key: string,
  resolve: () => Promise<string | null>,
): Promise<string | null> {
  const cached = readEmbedCache<CoverCacheData>(key);
  if (cached) return cached.url;

  try {
    const url = await resolve();
    if (!url) {
      console.warn(`[now-covers] ${key}: sin resultado — solo texto`);
      return null;
    }
    writeEmbedCache<CoverCacheData>(key, { url });
    return url;
  } catch (error) {
    console.warn(
      `[now-covers] ${key}: ${error instanceof Error ? error.message : String(error)} — solo texto`,
    );
    return null;
  }
}

async function fetchSongCover(
  title: string,
  artist: string,
): Promise<string | null> {
  return lookupCover(`itunes-cover:${artist} — ${title}`, async () => {
    const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(`${artist} ${title}`)}&entity=song&limit=1`;
    const body = (await fetchJson(endpoint)) as ItunesResponse;
    const artwork = body.results?.[0]?.artworkUrl100;
    if (!artwork) return null;
    return artwork.replace("100x100", "300x300");
  });
}

async function fetchBookCover(
  title: string,
  author: string,
): Promise<string | null> {
  return lookupCover(`openlibrary-cover:${title} — ${author}`, async () => {
    const endpoint = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`;
    const body = (await fetchJson(endpoint)) as OpenLibraryResponse;
    const coverId = body.docs?.[0]?.cover_i;
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
  });
}

/** Portadas para los valores actuales de lib/now.ts (override manual gana). */
export async function getNowCovers(): Promise<NowCovers> {
  const [listening, reading] = await Promise.all([
    now.listening.coverUrl ??
      fetchSongCover(now.listening.title, now.listening.artist),
    now.reading.coverUrl ??
      fetchBookCover(now.reading.title, now.reading.author),
  ]);
  return { listening, reading };
}
