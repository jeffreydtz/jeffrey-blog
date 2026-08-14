"use server";

import matter from "gray-matter";
import { redirect } from "next/navigation";
import {
  adminClientIp,
  adminEnabled,
  checkPassword,
  createSession,
  destroySession,
  requireAdmin,
} from "@/lib/admin/auth";
import { commitFile, deleteRepoFile, repoFile } from "@/lib/admin/github";
import { triggerDeploy } from "@/lib/admin/deploy";
import { rateLimit } from "@/lib/rate-limit";
import type { PostFrontmatter } from "@/types/post";

/**
 * Server actions del panel /admin. TODAS las mutaciones pasan por
 * requireAdmin() acá adentro — la protección real vive en la acción, no en
 * la página que la renderiza.
 */

// ---------- sesión ----------

export async function loginAction(formData: FormData): Promise<void> {
  if (!adminEnabled()) redirect("/admin/login?e=off");
  const ip = await adminClientIp();
  if (!rateLimit(`admin-login:${ip}`, 5)) redirect("/admin/login?e=rate");
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) redirect("/admin/login?e=bad");
  await createSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

export async function publishAction(): Promise<void> {
  await requireAdmin();
  const result = await triggerDeploy();
  redirect(`/admin?m=${encodeURIComponent(result.detail)}`);
}

// ---------- posts ----------

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function backToPost(slug: string, error: string): never {
  const base = slug ? `/admin/posts/${slug}` : "/admin/posts/new";
  redirect(`${base}?e=${encodeURIComponent(error)}`);
}

export async function savePostAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const originalSlug = String(formData.get("originalSlug") ?? "").trim();
  const sha = String(formData.get("sha") ?? "").trim() || undefined;
  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const cover_image = String(formData.get("cover_image") ?? "").trim();
  const published_at = String(formData.get("published_at") ?? "").trim();
  const updated_at = String(formData.get("updated_at") ?? "").trim();
  const lang = String(formData.get("lang") ?? "es");
  const draft = formData.get("draft") === "on";
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const back = originalSlug || "";
  // Campos de frontmatter son de una línea: sin saltos ni caracteres de
  // control (gray-matter/js-yaml escapa comillas solo; esto cierra el resto).
  const controlChars = /[\u0000-\u001f\u007f]/;
  for (const [field, value] of [
    ["título", title],
    ["excerpt", excerpt],
    ["cover_image", cover_image],
    ...tags.map((t): [string, string] => ["tag", t]),
  ] as Array<[string, string]>) {
    if (controlChars.test(value))
      backToPost(
        back,
        `El campo ${field} no puede tener saltos de línea ni caracteres de control.`,
      );
  }
  if (!title) backToPost(back, "Falta el título.");
  if (!SLUG_RE.test(slug))
    backToPost(back, "Slug inválido: minúsculas, números y guiones.");
  if (!excerpt) backToPost(back, "Falta el excerpt.");
  if (!DATE_RE.test(published_at))
    backToPost(back, "published_at debe ser YYYY-MM-DD.");
  if (updated_at && !DATE_RE.test(updated_at))
    backToPost(back, "updated_at debe ser YYYY-MM-DD.");
  if (tags.length === 0) backToPost(back, "Al menos un tag.");
  if (lang !== "es" && lang !== "en") backToPost(back, "Idioma inválido.");
  if (!body.trim()) backToPost(back, "El cuerpo está vacío.");

  const fm: PostFrontmatter = {
    title,
    slug,
    excerpt,
    ...(cover_image ? { cover_image } : {}),
    published_at,
    ...(updated_at ? { updated_at } : {}),
    tags,
    lang: lang === "en" ? "en" : "es",
    ...(draft ? { draft: true } : {}),
  };
  const mdx = matter.stringify(`\n${body.trim()}\n`, fm);

  const path = `content/posts/${slug}.mdx`;
  if (!originalSlug || originalSlug !== slug) {
    const clash = await repoFile(path);
    if (clash) backToPost(back, `Ya existe un post con slug "${slug}".`);
  }

  // Guardado con sha (edición) o creación. Rename = crear nuevo + borrar viejo.
  const isRename = Boolean(originalSlug) && originalSlug !== slug;
  try {
    await commitFile(
      path,
      mdx,
      `post: ${originalSlug && !isRename ? "editar" : "crear"} ${slug}`,
      isRename ? undefined : sha,
    );
  } catch {
    backToPost(
      back,
      "GitHub rechazó el commit (¿el archivo cambió mientras editabas?). Recargá y reintentá.",
    );
  }
  if (isRename) {
    const old = await repoFile(`content/posts/${originalSlug}.mdx`);
    if (old)
      await deleteRepoFile(old.path, `post: renombrar ${originalSlug} → ${slug}`, old.sha);
  }

  const result = await triggerDeploy();
  redirect(`/admin/posts?m=${encodeURIComponent(result.detail)}`);
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!SLUG_RE.test(slug)) redirect("/admin/posts");
  const file = await repoFile(`content/posts/${slug}.mdx`);
  if (file) await deleteRepoFile(file.path, `post: borrar ${slug}`, file.sha);
  const result = await triggerDeploy();
  redirect(`/admin/posts?m=${encodeURIComponent(result.detail)}`);
}

// ---------- páginas fijas (gabinete, acerca, colofon) ----------

const PAGE_SLUGS = new Set(["gabinete", "acerca", "colofon"]);

export async function savePageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  if (!PAGE_SLUGS.has(slug)) redirect("/admin");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").replace(/\r\n/g, "\n");
  const sha = String(formData.get("sha") ?? "").trim() || undefined;
  if (!title || !body.trim())
    redirect(`/admin/pages/${slug}?e=${encodeURIComponent("Título y cuerpo son obligatorios.")}`);

  const mdx = matter.stringify(`\n${body.trim()}\n`, {
    title,
    slug,
    lang: "es",
  });
  await commitFile(`content/pages/${slug}.mdx`, mdx, `pages: editar ${slug}`, sha);
  const result = await triggerDeploy();
  redirect(`/admin?m=${encodeURIComponent(result.detail)}`);
}

// ---------- widget "Ahora" ----------

export async function saveNowAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const listeningTitle = get("listeningTitle");
  const listeningArtist = get("listeningArtist");
  const listeningCover = get("listeningCover");
  const readingTitle = get("readingTitle");
  const readingAuthor = get("readingAuthor");
  const readingCover = get("readingCover");
  if (!listeningTitle || !listeningArtist || !readingTitle || !readingAuthor)
    redirect(`/admin/now?e=${encodeURIComponent("Título y artista/autor son obligatorios.")}`);

  const cover = (v: string) =>
    v ? `\n    coverUrl: ${JSON.stringify(v)},` : "";
  const text = `/**
 * Widget "Ahora" — qué estoy escuchando y leyendo en este momento.
 *
 * Flujo editorial: se edita desde /admin (o a mano); cada guardado es un
 * commit y el próximo deploy lo refleja en el footer. Sin scrobbling.
 *
 * Las portadas se resuelven solas en build time (lib/now-covers.ts: iTunes
 * para el disco, OpenLibrary para el libro) y quedan cacheadas en
 * \`.cache/embeds/\`. \`coverUrl\` es un override manual OPCIONAL: si está,
 * gana sobre la búsqueda automática; si la búsqueda no encuentra nada,
 * el widget queda solo-texto, como siempre.
 */

interface NowListening {
  title: string;
  artist: string;
  /** Override manual de portada; sin él se busca en iTunes en build time. */
  coverUrl?: string;
}

interface NowReading {
  title: string;
  author: string;
  /** Override manual de portada; sin él se busca en OpenLibrary en build time. */
  coverUrl?: string;
}

export interface Now {
  listening: NowListening;
  reading: NowReading;
}

export const now: Now = {
  listening: {
    title: ${JSON.stringify(listeningTitle)},
    artist: ${JSON.stringify(listeningArtist)},${cover(listeningCover)}
  },
  reading: {
    title: ${JSON.stringify(readingTitle)},
    author: ${JSON.stringify(readingAuthor)},${cover(readingCover)}
  },
};
`;

  const existing = await repoFile("lib/now.ts");
  await commitFile(
    "lib/now.ts",
    text,
    `chore(now): ${readingTitle} + ${listeningTitle}`,
    existing?.sha,
  );
  const result = await triggerDeploy();
  redirect(`/admin?m=${encodeURIComponent(result.detail)}`);
}
