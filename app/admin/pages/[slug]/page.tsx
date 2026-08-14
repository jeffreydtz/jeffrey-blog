import matter from "gray-matter";
import { notFound } from "next/navigation";
import { savePageAction } from "@/app/admin/actions";
import { Field, Notice, SubmitButton, inputClass } from "@/components/admin/Field";
import { requireAdmin } from "@/lib/admin/auth";
import { repoFile } from "@/lib/admin/github";

/**
 * Editor de páginas fijas: gabinete (curaduría), acerca, colofón.
 * Título + cuerpo MDX crudo; el frontmatter se regenera al guardar.
 */

const PAGES: Record<string, string> = {
  gabinete: "Gabinete — curaduría de lo que mirás y leés",
  acerca: "Acerca de",
  colofon: "Colofón",
};

export default async function AdminPagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  await requireAdmin();
  const [{ slug }, { e }] = await Promise.all([params, searchParams]);
  if (!(slug in PAGES)) notFound();
  const file = await repoFile(`content/pages/${slug}.mdx`);
  if (!file) notFound();
  const { data, content } = matter(file.text);

  return (
    <div>
      <Notice error={e} />
      <h1 className="font-display text-display-md text-ink">{PAGES[slug]}</h1>
      {slug === "gabinete" && (
        <p className="mt-sm max-w-prose text-body-sm text-ink-muted">
          Agregá vlogs con {"<YouTube id=\"…\" caption=\"…\" />"} y lecturas con{" "}
          {"<LinkCard url=\"…\" />"} — van directo en el cuerpo.
        </p>
      )}
      <form action={savePageAction} className="mt-lg flex flex-col gap-md">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="sha" value={file.sha} />
        <Field label="Título">
          <input
            name="title"
            defaultValue={String(data.title ?? "")}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Cuerpo (MDX)">
          <textarea
            name="body"
            defaultValue={content.trim()}
            required
            rows={24}
            className={`${inputClass} font-mono`}
          />
        </Field>
        <div>
          <SubmitButton>Guardar y publicar</SubmitButton>
        </div>
      </form>
    </div>
  );
}
