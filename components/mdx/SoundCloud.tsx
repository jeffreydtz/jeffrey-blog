import { EmbedFrame } from "@/components/mdx/EmbedFrame";
import { ui } from "@/lib/ui";

/**
 * Uso en MDX: `<SoundCloud url="https://soundcloud.com/artista/track" />` — T09.
 * Player clásico de 166px, iframe con loading="lazy".
 * El `color` del player replica el acento de DESIGN.md (colors.light.accent):
 * un query param de un player externo no puede leer CSS custom properties.
 */
export function SoundCloud({ url, title }: { url?: string; title?: string }) {
  if (
    !url ||
    !/^https:\/\/(soundcloud\.com|api\.soundcloud\.com|on\.soundcloud\.com)\//.test(
      url,
    )
  ) {
    throw new Error(
      `[mdx] <SoundCloud>: prop "url" requerida — URL completa de track/playlist en soundcloud.com, p. ej. <SoundCloud url="https://soundcloud.com/forss/flickermood" />. Recibido: ${JSON.stringify(url)}`,
    );
  }

  const src =
    `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}` +
    `&color=%235C1F1F&auto_play=false&hide_related=true&show_comments=false&show_teaser=false&visual=false`;

  return (
    <EmbedFrame height={166}>
      <iframe
        src={src}
        title={title ?? ui.mdx.soundcloudTitle}
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
        allow="autoplay"
      />
    </EmbedFrame>
  );
}
