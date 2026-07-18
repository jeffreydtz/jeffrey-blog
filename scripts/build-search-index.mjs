/**
 * Índice de búsqueda client-side (T14, FR-002) — corre en prebuild/predev.
 * Lee el frontmatter de content/posts/*.mdx con gray-matter y emite
 * public/search-index.json (contrato: types/search.ts). Drafts excluidos
 * siempre: el índice viaja al navegador también en dev.
 *
 * A propósito es un .mjs plano (sin tsx/ts-node): cero dependencias de
 * ejecución de TypeScript en el pipeline de build.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const postsDir = path.join(root, "content", "posts");
const outFile = path.join(root, "public", "search-index.json");

/**
 * gray-matter (js-yaml) parsea fechas YAML sin comillas como Date.
 * Mismo contrato que lib/posts.ts#toIsoDate: strings deben ser YYYY-MM-DD
 * y fecha real; cualquier otra cosa falla el build (nada de corrupción silenciosa).
 */
function toIsoDate(value, field, file) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    ) {
      return value;
    }
  }
  throw new Error(
    `[search-index] ${file}: "${field}" inválido (${String(value)}) — formato requerido: YYYY-MM-DD`,
  );
}

const docs = fs
  .readdirSync(postsDir)
  .filter((file) => file.endsWith(".mdx"))
  .map((file) => {
    const { data } = matter(fs.readFileSync(path.join(postsDir, file), "utf8"));
    return { data, file };
  })
  .filter(({ data }) => data.draft !== true)
  .map(({ data, file }) => {
    for (const field of ["title", "slug", "excerpt", "lang"]) {
      if (typeof data[field] !== "string" || data[field].trim() === "") {
        throw new Error(`[search-index] ${file}: "${field}" requerido`);
      }
    }
    const published_at = toIsoDate(data.published_at, "published_at", file);
    return {
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      lang: data.lang,
      published_at,
      year: Number(published_at.slice(0, 4)),
    };
  })
  .sort((a, b) => (a.published_at < b.published_at ? 1 : -1));

fs.writeFileSync(outFile, JSON.stringify(docs));
console.log(`[search-index] ${docs.length} posts → public/search-index.json`);
