import { now } from "@/lib/now";
import { getNowCovers } from "@/lib/now-covers";
import { ui } from "@/lib/ui";

/**
 * Widget "Ahora" (T17, FR-005) — qué estoy escuchando y leyendo, editado a
 * mano en lib/now.ts. Server component async: las portadas se resuelven en
 * build (lib/now-covers.ts, cache commiteado); sin portada el bloque queda
 * solo-texto como siempre. Mismo tratamiento tipográfico que el resto de la
 * metadata del footer (.label + body-sm ink-secondary / ink-muted), donde
 * vive su único mount.
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
      className="size-xl shrink-0 rounded-subtle border border-hairline object-cover"
    />
  );
}

export async function NowWidget() {
  const covers = await getNowCovers();

  return (
    <div className="flex flex-col gap-lg sm:flex-row sm:gap-2xl">
      <div className="flex items-center gap-sm">
        <Cover src={covers.listening} />
        <div>
          <p className="label">{ui.now.listening}</p>
          <p className="mt-xs text-body-sm text-ink-secondary">
            {now.listening.title}
            <span className="text-ink-muted"> — {now.listening.artist}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-sm">
        <Cover src={covers.reading} />
        <div>
          <p className="label">{ui.now.reading}</p>
          <p className="mt-xs text-body-sm text-ink-secondary">
            {now.reading.title}
            <span className="text-ink-muted"> — {now.reading.author}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
