"use client";

import { useState } from "react";

/**
 * Facade click-to-load para los embeds pesados (YouTube/Vimeo): en el HTML
 * estático solo viaja una miniatura + affordance de reproducción; el iframe
 * (y todo el JS del player) se inyecta recién al click. Esto es lo que
 * mantiene Lighthouse alto (FR-007). Única isla de cliente de los embeds —
 * mantener mínima.
 */
export function LazyEmbed({
  src,
  title,
  thumbnailSrc,
  playLabel,
}: {
  /** URL del iframe, ya con autoplay=1 (el click del usuario ES el play). */
  src: string;
  title: string;
  thumbnailSrc: string;
  playLabel: string;
}) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      aria-label={`${playLabel}: ${title}`}
      className="group absolute inset-0 block h-full w-full cursor-pointer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de host externo (i.ytimg.com / vumbnail.com); next/image proxearía hosts arbitrarios por el optimizador */}
      <img
        src={thumbnailSrc}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span className="label absolute bottom-sm left-sm border border-hairline bg-paper px-sm py-2xs text-ink transition-colors group-hover:bg-paper-raised">
        {playLabel}
      </span>
    </button>
  );
}
