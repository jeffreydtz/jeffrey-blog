import { MusicPreview } from "@/components/ui/MusicPreview";
import { now } from "@/lib/now";
import { getLibrary } from "@/lib/goodreads";
import { getNowTrack } from "@/lib/now-track";
import { ui } from "@/lib/ui";

/**
 * Canción editorial y primera lectura del RSS, en el orden del snapshot.
 * Goodreads se actualiza explícitamente; nunca se consulta durante la visita.
 * Título, autor, enlace y portada proceden del mismo libro, sin override manual.
 */

function Cover({ src }: { src: string | null }) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- portada remota de host de terceros; sin remotePatterns comodín (convención de la casa, ver CoverImage/MdxImage)
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className="max-h-full max-w-full rounded-subtle border border-hairline object-contain"
    />
  );
}

export async function NowWidget() {
  const library = getLibrary();
  const reading = library.currentlyReading?.[0];
  const track = await getNowTrack();

  return (
    <div className="grid min-w-0 grid-cols-1 gap-lg md:grid-cols-2 md:gap-xl">
      <MusicPreview
        key={`${now.listening.title}-${now.listening.artist}`}
        title={now.listening.title}
        artist={now.listening.artist}
        coverUrl={now.listening.coverUrl ?? track?.coverUrl ?? null}
        trackUrl={track?.trackUrl ?? null}
        previewUrl={track?.previewUrl ?? null}
      />
      <div className="flex min-w-0 items-start gap-sm">
        <div
          className="flex size-[var(--vinyl-size)] shrink-0 items-center justify-center"
          aria-hidden="true"
        >
          <Cover src={reading?.coverUrl ?? null} />
        </div>
        <div className="min-w-0">
          <p className="label text-ink-secondary">{ui.now.reading}</p>
          <p className="mt-xs break-words text-body-sm text-ink-secondary">
            {reading
              ? `${reading.title} — ${reading.author}`
              : ui.now.noReading}
          </p>
          <a
            href={reading?.url ?? library.profileUrl}
            className="link-underline inline-flex min-h-[var(--control-target)] items-center text-body-sm text-ink-secondary"
          >
            {ui.library.bookLink}
          </a>
        </div>
      </div>
    </div>
  );
}
