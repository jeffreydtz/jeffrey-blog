import { getI18n } from "@/lib/i18n/server";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { SITE } from "@/lib/site";

/** OG image default del sitio (T15) — home y páginas sin card propia. */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = SITE.name;

export default async function Image() {
  const { ui } = await getI18n();
  return renderOgImage({
    eyebrow: SITE.author,
    title: SITE.name,
    footer: ui.siteDescription,
  });
}
