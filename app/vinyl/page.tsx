import type { Metadata } from "next";
import { Turntable } from "@/components/three/Turntable";
import { ui } from "@/lib/ui";
import { getVinylRecords } from "@/lib/vinyl";

/**
 * /vinyl — tocadiscos dedicado. WebGL solo acá (no en /): un disco
 * procedural + plinto simple, alimentado por lib/now.ts y content/data/vinyl.json.
 */

export const metadata: Metadata = {
  title: ui.vinyl.title,
  description: ui.pages.vinylDescription,
  alternates: { canonical: "/vinyl" },
};

export default async function VinylPage() {
  const records = await getVinylRecords();

  return (
    <div className="mx-auto w-full max-w-page px-lg">
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
