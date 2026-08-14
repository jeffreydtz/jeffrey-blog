import { Notice } from "@/components/admin/Field";
import { PostForm } from "@/components/admin/PostForm";
import { requireAdmin } from "@/lib/admin/auth";

/** Alta de publicación — fecha de hoy precargada. */

export default async function AdminNewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  await requireAdmin();
  const { e } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <Notice error={e} />
      <h1 className="font-display text-display-md text-ink">
        Nueva publicación
      </h1>
      <PostForm
        originalSlug=""
        sha=""
        values={{
          slug: "",
          title: "",
          excerpt: "",
          cover_image: "",
          published_at: today,
          updated_at: "",
          tags: "",
          lang: "es",
          draft: false,
          body: "",
        }}
      />
    </div>
  );
}
