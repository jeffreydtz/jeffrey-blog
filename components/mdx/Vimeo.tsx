import { EmbedFrame } from "@/components/mdx/EmbedFrame";
import { LazyEmbed } from "@/components/mdx/LazyEmbed";
import { ui } from "@/lib/ui";

/** Uso en MDX: `<Vimeo id="76979871" caption="…" />` — T09. */
export function Vimeo({
  id,
  title,
  caption,
}: {
  id?: string;
  title?: string;
  caption?: string;
}) {
  if (!id || !/^\d{4,15}$/.test(id)) {
    throw new Error(
      `[mdx] <Vimeo>: prop "id" requerida — el id numérico del video, p. ej. <Vimeo id="76979871" />. Recibido: ${JSON.stringify(id)}`,
    );
  }
  const frameTitle = title ?? ui.mdx.vimeoTitle;
  return (
    <EmbedFrame aspectRatio="16 / 9" caption={caption}>
      <LazyEmbed
        src={`https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`}
        title={frameTitle}
        thumbnailSrc={`https://vumbnail.com/${id}.jpg`}
        playLabel={ui.mdx.play}
      />
    </EmbedFrame>
  );
}
