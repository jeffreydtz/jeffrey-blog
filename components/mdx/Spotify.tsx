import { EmbedFrame } from "@/components/mdx/EmbedFrame";
import { ui } from "@/lib/ui";

const KINDS = [
  "track",
  "album",
  "playlist",
  "episode",
  "show",
  "artist",
] as const;
type SpotifyKind = (typeof KINDS)[number];

/**
 * Uso en MDX — T09:
 *   `<Spotify id="0Hs3BomCdwIWRhgT57x22T" kind="album" />`
 *   `<Spotify url="https://open.spotify.com/track/…" />`
 *   `compact` → player de 152px (352px full por defecto).
 * Player liviano de Spotify: iframe directo con loading="lazy" (sin facade;
 * no hay miniatura pública estable y el peso es menor que el de video).
 */
export function Spotify({
  id,
  kind,
  url,
  compact = false,
  title,
}: {
  id?: string;
  kind?: SpotifyKind;
  url?: string;
  compact?: boolean;
  title?: string;
}) {
  let resolvedId = id;
  let resolvedKind = kind;

  if (url) {
    const match =
      /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/.exec(
        url,
      );
    if (!match) {
      throw new Error(
        `[mdx] <Spotify>: url no reconocida — se espera https://open.spotify.com/{track|album|playlist|episode|show|artist}/{id}. Recibido: ${JSON.stringify(url)}`,
      );
    }
    resolvedKind = match[1] as SpotifyKind;
    resolvedId = match[2];
  }

  if (
    !resolvedId ||
    !/^[A-Za-z0-9]{10,40}$/.test(resolvedId) ||
    !resolvedKind ||
    !KINDS.includes(resolvedKind)
  ) {
    throw new Error(
      `[mdx] <Spotify>: se requiere prop "url", o bien "id" + "kind" (${KINDS.join(" | ")}), p. ej. <Spotify id="0Hs3BomCdwIWRhgT57x22T" kind="album" />. Recibido: id=${JSON.stringify(id)} kind=${JSON.stringify(kind)} url=${JSON.stringify(url)}`,
    );
  }

  return (
    <EmbedFrame height={compact ? 152 : 352}>
      <iframe
        src={`https://open.spotify.com/embed/${resolvedKind}/${resolvedId}`}
        title={title ?? ui.mdx.spotifyTitle}
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
    </EmbedFrame>
  );
}
