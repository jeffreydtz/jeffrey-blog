import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { readingTimeMinutes } from "@/lib/reading-time";
import type {
  AdjacentPosts,
  Post,
  PostFrontmatter,
  PostLang,
  YearGroup,
} from "@/types/post";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

/** Drafts visibles solo en desarrollo (spec FR-001). */
const INCLUDE_DRAFTS = process.env.NODE_ENV === "development";

/**
 * gray-matter (js-yaml) convierte fechas YAML sin comillas a Date; normalizamos a ISO corto.
 * Strings deben ser YYYY-MM-DD y fecha real: aguas abajo se asume ese formato
 * (rss hace slice(0,10), el índice deriva year) — todo lo demás falla el build.
 */
function toIsoDate(value: unknown, field: string, file: string): string {
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
    `[posts] ${file}: frontmatter "${field}" inválido (${String(value)}) — formato requerido: YYYY-MM-DD`,
  );
}

function assertLang(value: unknown, file: string): PostLang {
  if (value === "es" || value === "en") return value;
  throw new Error(`[posts] ${file}: frontmatter "lang" debe ser "es" | "en"`);
}

function parsePostFile(fileName: string): Post {
  const raw = fs.readFileSync(path.join(POSTS_DIR, fileName), "utf8");
  const { data, content } = matter(raw);

  for (const field of ["title", "slug", "excerpt"] as const) {
    if (typeof data[field] !== "string" || data[field].trim() === "") {
      throw new Error(`[posts] ${fileName}: frontmatter "${field}" requerido`);
    }
  }
  if (
    !Array.isArray(data.tags) ||
    data.tags.some((t) => typeof t !== "string")
  ) {
    throw new Error(
      `[posts] ${fileName}: frontmatter "tags" debe ser string[]`,
    );
  }

  const frontmatter: PostFrontmatter = {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    cover_image:
      typeof data.cover_image === "string" ? data.cover_image : undefined,
    published_at: toIsoDate(data.published_at, "published_at", fileName),
    updated_at:
      data.updated_at != null
        ? toIsoDate(data.updated_at, "updated_at", fileName)
        : undefined,
    tags: data.tags,
    lang: assertLang(data.lang, fileName),
    draft: data.draft === true,
  };

  return {
    ...frontmatter,
    content,
    readingTimeMinutes: readingTimeMinutes(content),
  };
}

let cache: Post[] | null = null;

/** Todos los posts publicados, orden cronológico descendente (más nuevo primero). */
export function getAllPosts(): Post[] {
  if (cache !== null && process.env.NODE_ENV === "production") return cache;

  const posts = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(parsePostFile)
    .filter((p) => INCLUDE_DRAFTS || !p.draft)
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );

  const slugs = new Set<string>();
  for (const post of posts) {
    if (slugs.has(post.slug)) {
      throw new Error(`[posts] slug duplicado: "${post.slug}"`);
    }
    slugs.add(post.slug);
  }

  cache = posts;
  return posts;
}

export function getPostBySlug(slug: string): Post | null {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

/** Posts agrupados por año, años descendentes (biblioteca: 2026, 2025…). */
export function getPostsByYear(): YearGroup[] {
  const groups = new Map<number, Post[]>();
  for (const post of getAllPosts()) {
    const year = new Date(post.published_at).getUTCFullYear();
    const group = groups.get(year);
    if (group) group.push(post);
    else groups.set(year, [post]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, posts]) => ({ year, posts }));
}

/**
 * Relacionados por tags compartidos: score = cantidad de tags en común,
 * tie-break por fecha (más reciente primero). Score 0 queda excluido.
 */
export function getRelatedPosts(slug: string, limit = 3): Post[] {
  const current = getPostBySlug(slug);
  if (!current) return [];
  const currentTags = new Set(current.tags);

  return getAllPosts()
    .filter((p) => p.slug !== slug)
    .map((post) => ({
      post,
      score: post.tags.filter((t) => currentTags.has(t)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.post.published_at).getTime() -
          new Date(a.post.published_at).getTime(),
    )
    .slice(0, limit)
    .map(({ post }) => post);
}

/** prev = anterior en el tiempo (más viejo), next = siguiente (más nuevo). */
export function getAdjacentPosts(slug: string): AdjacentPosts {
  const posts = getAllPosts(); // orden descendente
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: posts[index + 1] ?? null,
    next: posts[index - 1] ?? null,
  };
}
