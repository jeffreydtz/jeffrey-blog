import { saveNowAction } from "@/app/admin/actions";
import { Field, Notice, SubmitButton, inputClass } from "@/components/admin/Field";
import { requireAdmin } from "@/lib/admin/auth";
import { repoFile } from "@/lib/admin/github";

/**
 * Widget "Ahora" — currently listening / currently reading del footer.
 * Lee lib/now.ts del repo, extrae los valores actuales y regenera el
 * archivo al guardar (commit + rebuild).
 */

function extract(block: string, field: string): string {
  const match = block.match(new RegExp(`${field}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  try {
    return match ? (JSON.parse(`"${match[1]}"`) as string) : "";
  } catch {
    return "";
  }
}

function section(text: string, name: string): string {
  const match = text.match(new RegExp(`${name}:\\s*\\{([\\s\\S]*?)\\}`));
  return match ? match[1] : "";
}

export default async function AdminNowPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  await requireAdmin();
  const { e } = await searchParams;
  const file = await repoFile("lib/now.ts");
  const listening = section(file?.text ?? "", "listening");
  const reading = section(file?.text ?? "", "reading");

  return (
    <div>
      <Notice error={e} />
      <h1 className="font-display text-display-md text-ink">Ahora</h1>
      <p className="mt-sm max-w-prose text-body-sm text-ink-muted">
        Qué estás escuchando y leyendo — aparece en el pie de todas las
        páginas. Las portadas se buscan solas en el build (iTunes /
        OpenLibrary); la URL manual es opcional y gana si está.
      </p>
      <form action={saveNowAction} className="mt-lg flex max-w-prose flex-col gap-lg">
        <fieldset className="flex flex-col gap-md">
          <legend className="label mb-xs">Escuchando</legend>
          <Field label="Disco / canción">
            <input
              name="listeningTitle"
              defaultValue={extract(listening, "title")}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Artista">
            <input
              name="listeningArtist"
              defaultValue={extract(listening, "artist")}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Portada (URL, opcional)">
            <input
              name="listeningCover"
              defaultValue={extract(listening, "coverUrl")}
              className={inputClass}
            />
          </Field>
        </fieldset>
        <fieldset className="flex flex-col gap-md">
          <legend className="label mb-xs">Leyendo</legend>
          <Field label="Libro">
            <input
              name="readingTitle"
              defaultValue={extract(reading, "title")}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Autor">
            <input
              name="readingAuthor"
              defaultValue={extract(reading, "author")}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Portada (URL, opcional)">
            <input
              name="readingCover"
              defaultValue={extract(reading, "coverUrl")}
              className={inputClass}
            />
          </Field>
        </fieldset>
        <div>
          <SubmitButton>Guardar y publicar</SubmitButton>
        </div>
      </form>
    </div>
  );
}
