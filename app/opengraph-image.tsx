import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { SITE } from "@/lib/site";

/** OG image default del sitio (T15) — home y páginas sin card propia. */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = SITE.name;

export default function Image() {
  return renderOgImage({
    eyebrow: SITE.author,
    title: SITE.name,
    footer: SITE.description,
  });
}
