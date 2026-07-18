import "server-only";
import { readEmbedCache, writeEmbedCache } from "@/lib/embed-cache";
import { decodeEntities, stripTags } from "@/lib/html-text";

/**
 * LinkCard vía scrape OpenGraph en build/render time (SSG) — spec FR-004,
 * "nunca iframe". Regex sobre los primeros 100 KB del documento; timeout y
 * cap de tamaño obligatorios (las URLs las escribe el autor en build time,
 * SSRF no es superficie acá, pero un remoto colgado no puede colgar el build).
 *
 * Misma disciplina de cache/fallback que lib/oembed.ts: cache en disco
 * commiteado; sin cache + red caída → null → el componente cae a link plano
 * estilado. El build NUNCA falla por red.
 */

export interface LinkCardData {
  url: string;
  title: string;
  description?: string;
  siteName?: string;
  image?: string;
}

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 100 * 1024;
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** Lee como máximo MAX_BYTES del body y cancela el stream. */
async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks).toString("utf8");
}

function metaContent(html: string, key: string): string | undefined {
  const attr = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const forward = new RegExp(
    `<meta[^>]+(?:property|name)=["']${attr}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const backward = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${attr}["']`,
    "i",
  );
  const match = forward.exec(html) ?? backward.exec(html);
  const value = match ? decodeEntities(match[1]).trim() : "";
  return value || undefined;
}

function titleTag(html: string): string | undefined {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const value = match ? decodeEntities(stripTags(match[1])).trim() : "";
  return value || undefined;
}

function absoluteUrl(
  value: string | undefined,
  base: string,
): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
}

export async function fetchLinkCard(url: string): Promise<LinkCardData | null> {
  const key = `og:${url}`;
  const cached = readEmbedCache<LinkCardData>(key);
  if (cached) return cached;

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": BROWSER_UA,
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      console.warn(`[og-scrape] ${url}: HTTP ${res.status} — fallback`);
      return null;
    }
    const finalUrl = res.url || url;
    const html = await readCapped(res);

    const title =
      metaContent(html, "og:title") ??
      metaContent(html, "twitter:title") ??
      titleTag(html);
    if (!title) {
      console.warn(`[og-scrape] ${url}: sin og:title ni <title> — fallback`);
      return null;
    }

    const data: LinkCardData = {
      url: finalUrl,
      title,
      description:
        metaContent(html, "og:description") ?? metaContent(html, "description"),
      siteName: metaContent(html, "og:site_name"),
      image: absoluteUrl(metaContent(html, "og:image"), finalUrl),
    };
    writeEmbedCache(key, data);
    return data;
  } catch (error) {
    console.warn(
      `[og-scrape] ${url}: ${error instanceof Error ? error.message : String(error)} — fallback`,
    );
    return null;
  }
}
