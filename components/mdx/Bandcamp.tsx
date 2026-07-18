import { EmbedFrame } from "@/components/mdx/EmbedFrame";
import { ui } from "@/lib/ui";

/**
 * Uso en MDX — T09 (formato EmbeddedPlayer de Bandcamp, ids numéricos):
 *   `<Bandcamp album="2721182898" />`
 *   `<Bandcamp track="1963341082" />`
 *   `<Bandcamp album="2721182898" track="1963341082" />` (track dentro de álbum)
 * Player slim estándar (size=large + artwork=small + sin tracklist → 120px).
 * bgcol/linkcol replican paper/accent de DESIGN.md (colors.light): el player
 * externo se configura por query param, no puede leer CSS custom properties.
 */
export function Bandcamp({
  album,
  track,
  title,
}: {
  album?: string;
  track?: string;
  title?: string;
}) {
  if (album && !/^\d{1,20}$/.test(album)) {
    throw new Error(
      `[mdx] <Bandcamp>: prop "album" debe ser el id numérico del álbum. Recibido: ${JSON.stringify(album)}`,
    );
  }
  if (track && !/^\d{1,20}$/.test(track)) {
    throw new Error(
      `[mdx] <Bandcamp>: prop "track" debe ser el id numérico del track. Recibido: ${JSON.stringify(track)}`,
    );
  }
  if (!album && !track) {
    throw new Error(
      '[mdx] <Bandcamp>: se requiere prop "album" y/o "track" (ids numéricos del EmbeddedPlayer, visibles en el código de embed que da Bandcamp), p. ej. <Bandcamp album="2721182898" />.',
    );
  }

  const parts = [
    album ? `album=${album}` : null,
    track ? `track=${track}` : null,
  ].filter(Boolean);
  const src =
    `https://bandcamp.com/EmbeddedPlayer/${parts.join("/")}` +
    `/size=large/bgcol=F5F1E8/linkcol=5C1F1F/tracklist=false/artwork=small/transparent=true/`;

  return (
    <EmbedFrame height={120}>
      <iframe
        src={src}
        title={title ?? ui.mdx.bandcampTitle}
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
        seamless
      />
    </EmbedFrame>
  );
}
