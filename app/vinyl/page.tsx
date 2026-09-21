import { getI18n } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/i18n/metadata";
import type { Metadata } from "next";
import { Turntable } from "@/components/three/Turntable";

import { getVinylRecords } from "@/lib/vinyl";

/**
 * /vinyl — tocadiscos dedicado. WebGL solo acá (no en /): un disco
 * procedural + plinto simple, alimentado por lib/now.ts y content/data/vinyl.json.
 */

export async function generateMetadata(): Promise<Metadata> {
  const { locale, ui } = await getI18n();
  return pageMetadata(
    "/vinyl",
    locale,
    ui.vinyl.title,
    ui.pages.vinylDescription,
  );
}

export default async function VinylPage() {
  const { ui } = await getI18n();

  const records = await getVinylRecords();

  return (
    <div className="mx-auto w-full max-w-page px-xs sm:px-lg">
      <div className="py-2xl sm:py-3xl sm:pl-[14%]">
        <h1 className="font-display text-display-lg text-ink">
          {ui.vinyl.title}
        </h1>
        <p className="mt-md max-w-prose text-ink-secondary">{ui.vinyl.intro}</p>
        <Turntable records={records} />
      </div>
    </div>
  );
}
