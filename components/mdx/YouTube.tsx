import { EmbedFrame } from "@/components/mdx/EmbedFrame";
import { LazyEmbed } from "@/components/mdx/LazyEmbed";
import { ui } from "@/lib/ui";

/** Uso en MDX: `<YouTube id="ZXsQAXx_ao0" caption="…" />` — T09. */
export function YouTube({
  id,
  title,
  caption,
}: {
  id?: string;
  title?: string;
  caption?: string;
}) {
  if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) {
    throw new Error(
      `[mdx] <YouTube>: prop "id" requerida — el id del video (lo que sigue a watch?v=), p. ej. <YouTube id="ZXsQAXx_ao0" />. Recibido: ${JSON.stringify(id)}`,
    );
  }
  const frameTitle = title ?? ui.mdx.youtubeTitle;
  return (
    <EmbedFrame aspectRatio="16 / 9" caption={caption}>
      <LazyEmbed
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={frameTitle}
        thumbnailSrc={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        playLabel={ui.mdx.play}
      />
    </EmbedFrame>
  );
}
