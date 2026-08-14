import matter from "gray-matter";
import Link from "next/link";
import { Notice } from "@/components/admin/Field";
import { requireAdmin } from "@/lib/admin/auth";
import { repoDir, repoFile } from "@/lib/admin/github";

/** Listado de publicaciones (desde el repo, no del build). */

interface Row {
  slug: string;
  title: string;
  published_at: string;
  draft: boolean;
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  await requireAdmin();
  const { m } = await searchParams;
  const entries = await repoDir("content/posts");
  const rows: Row[] = (
    await Promise.all(
      entries
        .filter((e) => e.name.endsWith(".mdx"))
        .map(async (e): Promise<Row> => {
          const file = await repoFile(e.path);
          const data = file ? matter(file.text).data : {};
          const slug = e.name.replace(/\.mdx$/, "");
          return {
            slug,
            title: typeof data.title === "string" ? data.title : slug,
            published_at: String(data.published_at ?? "").slice(0, 10),
            draft: data.draft === true,
          };
        }),
    )
  ).sort((a, b) => (a.published_at < b.published_at ? 1 : -1));

  return (
    <div>
      <Notice message={m} />
      <div className="flex flex-wrap items-baseline justify-between gap-md">
        <h1 className="font-display text-display-md text-ink">
          Publicaciones
        </h1>
        <Link
          href="/admin/posts/new"
          className="label link-underline weight-hover text-ink"
        >
          + Nueva publicación
        </Link>
      </div>
      <ul className="mt-lg">
        {rows.map((row, i) => (
          <li key={row.slug} className={i > 0 ? "hairline" : undefined}>
            <div className="flex flex-wrap items-baseline justify-between gap-md py-md">
              <Link
                href={`/admin/posts/${row.slug}`}
                className="link-underline weight-hover font-display text-display-sm text-ink"
              >
                {row.title}
              </Link>
              <p className="label" data-tnum>
                {row.published_at}
                {row.draft ? " · borrador" : ""}
              </p>
            </div>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="py-md text-body-sm text-ink-muted">
            No hay publicaciones todavía.
          </li>
        )}
      </ul>
    </div>
  );
}
