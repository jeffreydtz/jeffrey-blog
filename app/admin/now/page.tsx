import { requireAdmin } from "@/lib/admin/auth";
import { githubUserMessage, repoFile } from "@/lib/admin/github";
import { Notice } from "@/components/admin/Field";
import { NowForm } from "@/components/admin/NowForm";

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

  let loadError: string | undefined;
  let fileText = "";
  try {
    const file = await repoFile("lib/now.ts");
    fileText = file?.text ?? "";
  } catch (error) {
    loadError = githubUserMessage(error);
  }

  const listening = section(fileText, "listening");
  const reading = section(fileText, "reading");

  return (
    <div>
      <Notice error={e ?? loadError} />
      <h1 className="font-display text-display-md text-ink">Ahora</h1>
      <p className="mt-sm max-w-prose text-body-sm text-ink-muted">
        Buscá una canción o un libro para rellenar título, artista/autor y
        portada; los campos siguen editables a mano. Las portadas también se
        buscan solas en el build (iTunes / OpenLibrary) si la URL queda vacía.
      </p>
      <NowForm
        values={{
          listeningTitle: extract(listening, "title"),
          listeningArtist: extract(listening, "artist"),
          listeningCover: extract(listening, "coverUrl"),
          readingTitle: extract(reading, "title"),
          readingAuthor: extract(reading, "author"),
          readingCover: extract(reading, "coverUrl"),
        }}
      />
    </div>
  );
}
