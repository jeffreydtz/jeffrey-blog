import matter from "gray-matter";
import { notFound } from "next/navigation";
import { deletePostAction } from "@/app/admin/actions";
import { Notice } from "@/components/admin/Field";
import { PostForm } from "@/components/admin/PostForm";
import { requireAdmin } from "@/lib/admin/auth";
import { repoFile } from "@/lib/admin/github";

/** Edición de una publicación existente (leída del repo). */

export default async function AdminEditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  await requireAdmin();
  const [{ slug }, { e }] = await Promise.all([params, searchParams]);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();
  const file = await repoFile(`content/posts/${slug}.mdx`);
  if (!file) notFound();

  const { data, content } = matter(file.text);
  const date = (v: unknown) =>
    v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? "");

  return (
    <div>
      <Notice error={e} />
      <div className="flex flex-wrap items-baseline justify-between gap-md">
        <h1 className="font-display text-display-md text-ink">
          Editar: {String(data.title ?? slug)}
        </h1>
        <form action={deletePostAction}>
          <input type="hidden" name="slug" value={slug} />
          <button
            type="submit"
            className="label cursor-pointer text-accent hover:text-accent-hover"
          >
            Borrar publicación
          </button>
        </form>
      </div>
      <PostForm
        originalSlug={slug}
        sha={file.sha}
        values={{
          slug,
          title: String(data.title ?? ""),
          excerpt: String(data.excerpt ?? ""),
          cover_image: String(data.cover_image ?? ""),
          published_at: date(data.published_at),
          updated_at: date(data.updated_at),
          tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
          lang: data.lang === "en" ? "en" : "es",
          draft: data.draft === true,
          body: content.trim(),
        }}
      />
    </div>
  );
}
