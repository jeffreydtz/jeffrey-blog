import { savePostAction } from "@/app/admin/actions";
import { Field, SubmitButton, inputClass } from "@/components/admin/Field";

/**
 * Formulario de publicación (crear/editar). Frontmatter estructurado +
 * cuerpo MDX crudo — los componentes (<YouTube>, <Spotify>, <LinkCard>…)
 * se escriben directo en el cuerpo, igual que en un archivo.
 */

export interface PostFormValues {
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string;
  published_at: string;
  updated_at: string;
  tags: string;
  lang: string;
  draft: boolean;
  body: string;
}

export function PostForm({
  values,
  originalSlug,
  sha,
}: {
  values: PostFormValues;
  /** Vacío = post nuevo. */
  originalSlug: string;
  sha: string;
}) {
  return (
    <form action={savePostAction} className="mt-lg flex flex-col gap-md">
      <input type="hidden" name="originalSlug" value={originalSlug} />
      <input type="hidden" name="sha" value={sha} />

      <div className="grid gap-md sm:grid-cols-2">
        <Field label="Título">
          <input
            name="title"
            defaultValue={values.title}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Slug (URL)">
          <input
            name="slug"
            defaultValue={values.slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Excerpt">
        <textarea
          name="excerpt"
          defaultValue={values.excerpt}
          required
          rows={2}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-md sm:grid-cols-4">
        <Field label="Publicado (YYYY-MM-DD)">
          <input
            name="published_at"
            defaultValue={values.published_at}
            required
            pattern="\d{4}-\d{2}-\d{2}"
            className={inputClass}
          />
        </Field>
        <Field label="Actualizado (opcional)">
          <input
            name="updated_at"
            defaultValue={values.updated_at}
            pattern="\d{4}-\d{2}-\d{2}"
            className={inputClass}
          />
        </Field>
        <Field label="Idioma">
          <select name="lang" defaultValue={values.lang} className={inputClass}>
            <option value="es">es</option>
            <option value="en">en</option>
          </select>
        </Field>
        <Field label="Borrador">
          <span className="flex h-full items-center gap-xs text-body-sm text-ink-secondary">
            <input
              type="checkbox"
              name="draft"
              defaultChecked={values.draft}
            />
            solo visible en dev
          </span>
        </Field>
      </div>

      <div className="grid gap-md sm:grid-cols-2">
        <Field label="Tags (separados por coma)">
          <input
            name="tags"
            defaultValue={values.tags}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Portada (ruta en public/ o URL, opcional)">
          <input
            name="cover_image"
            defaultValue={values.cover_image}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Cuerpo (MDX — <YouTube>, <Spotify>, <LinkCard>… van directo)">
        <textarea
          name="body"
          defaultValue={values.body}
          required
          rows={22}
          className={`${inputClass} font-mono`}
        />
      </Field>

      <div>
        <SubmitButton>Guardar y publicar</SubmitButton>
      </div>
    </form>
  );
}
