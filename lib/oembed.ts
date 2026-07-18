import "server-only";
import { readEmbedCache, writeEmbedCache } from "@/lib/embed-cache";
import { decodeEntities, stripTags } from "@/lib/html-text";

/**
 * Tweet vía oEmbed público de publish.twitter.com (sin API key) — spec FR-004.
 * Corre en build/render time (SSG). Del blockquote HTML que devuelve el
 * endpoint extraemos texto / autor / fecha con string parsing (sin widget de
 * Twitter, sin iframe) y el componente <Tweet> lo pinta como cita estática.
 *
 * Disciplina de red (T10): cache en disco commiteado; si hay valor cacheado
 * se usa siempre; si no hay cache y la red falla → null y el componente
 * renderiza fallback ("Ver en X"). El build NUNCA falla por red.
 */

export interface TweetData {
  text: string;
  author: string;
  date: string;
  url: string;
}

interface OembedResponse {
  html?: string;
  author_name?: string;
  author_url?: string;
  url?: string;
}

const TIMEOUT_MS = 10_000;

function parseOembedHtml(body: OembedResponse): Omit<TweetData, "url"> | null {
  const html = body.html ?? "";

  const textMatch = /<p[^>]*>([\s\S]*?)<\/p>/.exec(html);
  if (!textMatch) return null;
  const text = decodeEntities(stripTags(textMatch[1])).trim();
  if (!text) return null;

  // "…</p>&mdash; jack (@jack) <a …>March 21, 2006</a></blockquote>"
  const authorMatch = /&mdash;\s*([\s\S]*?)\s*<a/.exec(html);
  const author = authorMatch
    ? decodeEntities(stripTags(authorMatch[1])).trim()
    : (body.author_name ?? "");

  const dateMatch = /<a[^>]*>([^<]+)<\/a>\s*<\/blockquote>/.exec(html);
  const date = dateMatch ? decodeEntities(dateMatch[1]).trim() : "";

  return { text, author, date };
}

export async function fetchTweet(id: string): Promise<TweetData | null> {
  const key = `tweet:${id}`;
  const cached = readEmbedCache<TweetData>(key);
  if (cached) return cached;

  const statusUrl = `https://twitter.com/i/status/${id}`;
  try {
    const endpoint = `https://publish.twitter.com/oembed?url=${encodeURIComponent(statusUrl)}&omit_script=true&dnt=true`;
    const res = await fetch(endpoint, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`[oembed] tweet ${id}: HTTP ${res.status} — fallback`);
      return null;
    }
    const body = (await res.json()) as OembedResponse;
    const parsed = parseOembedHtml(body);
    if (!parsed) {
      console.warn(`[oembed] tweet ${id}: HTML inesperado — fallback`);
      return null;
    }
    const data: TweetData = { ...parsed, url: body.url ?? statusUrl };
    writeEmbedCache(key, data);
    return data;
  } catch (error) {
    console.warn(
      `[oembed] tweet ${id}: ${error instanceof Error ? error.message : String(error)} — fallback`,
    );
    return null;
  }
}
