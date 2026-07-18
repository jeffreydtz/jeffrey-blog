import "server-only";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Cache en disco para datos de embeds resueltos en build time
 * (Tweet oEmbed, LinkCard OpenGraph). Decisión de arquitectura #2 (plan.md):
 * `.cache/embeds/` se COMMITEA al repo → builds de Vercel reproducibles y
 * rápidos, sin depender de que Twitter/el sitio remoto respondan en cada
 * deploy. Miss de cache + red caída → el componente cae a fallback estático;
 * el build nunca rompe por red.
 *
 * Clave = sha1 de un string estable ("tweet:<id>", "og:<url>").
 * Valor = JSON { key, fetchedAt, data } — `key` legible para auditar el cache.
 */

const CACHE_DIR = path.join(process.cwd(), ".cache", "embeds");

interface CacheEnvelope<T> {
  key: string;
  fetchedAt: string;
  data: T;
}

function cacheFile(key: string): string {
  const hash = crypto.createHash("sha1").update(key).digest("hex");
  return path.join(CACHE_DIR, `${hash}.json`);
}

export function readEmbedCache<T>(key: string): T | null {
  try {
    const raw = fs.readFileSync(cacheFile(key), "utf8");
    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    return envelope.data ?? null;
  } catch {
    return null;
  }
}

export function writeEmbedCache<T>(key: string, data: T): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const envelope: CacheEnvelope<T> = {
      key,
      fetchedAt: new Date().toISOString(),
      data,
    };
    fs.writeFileSync(cacheFile(key), `${JSON.stringify(envelope, null, 2)}\n`);
  } catch {
    // Cache de solo-conveniencia: si el disco falla no rompemos el render.
  }
}
