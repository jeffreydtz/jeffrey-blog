import type { CSSProperties, ReactNode } from "react";

/**
 * Contenedor común de embeds (spec FR-004): borde 1px hairline, radius
 * `subtle` (el máximo del sitio), sin sombras. El aspect-ratio (video) o la
 * altura fija (players de audio) se fija acá para que el layout no salte
 * mientras carga el contenido de terceros (CLS = 0).
 *
 * Tratamiento old-money: el marco es del sitio (tokens); lo que viva adentro
 * del iframe de terceros queda como venga — aceptable por spec.
 *
 * `caption` opcional: pie editorial en .label bajo el marco (mismo criterio
 * que el pie de foto de MdxImage) — con caption el contenedor es <figure>.
 */
export function EmbedFrame({
  aspectRatio,
  height,
  caption,
  children,
}: {
  /** Ej.: "16 / 9" para video. Excluyente con height. */
  aspectRatio?: string;
  /** Altura fija en px para players de audio (Spotify 152/352, SoundCloud 166…). */
  height?: number;
  /** Pie editorial opcional bajo el marco (estilo .label). */
  caption?: string;
  children: ReactNode;
}) {
  const style: CSSProperties = aspectRatio
    ? { aspectRatio }
    : { height: height ? `${height}px` : undefined };

  const media = (
    <div
      className="relative overflow-hidden rounded-subtle border border-hairline bg-paper-raised"
      style={style}
    >
      {children}
    </div>
  );

  // print-hidden (T18): caja interactiva de terceros — no llega al papel
  if (!caption) {
    return <div className="print-hidden my-lg">{media}</div>;
  }
  return (
    <figure className="print-hidden my-lg">
      {media}
      <figcaption className="label mt-sm">{caption}</figcaption>
    </figure>
  );
}
