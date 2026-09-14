import "server-only";
import history from "@/content/data/listening-history.json";
import { now } from "@/lib/now";
import { getListeningTrack } from "@/lib/now-track";
import {
  accumulateListening,
  parseListeningHistory,
  sameListeningTrack,
} from "@/lib/listening-history";
import type { VinylRecord } from "@/lib/vinyl-data";

export type { VinylRecord } from "@/lib/vinyl-data";

/** Personal songs only. The former sample album crate is not listening history. */
export async function getVinylRecords(): Promise<VinylRecord[]> {
  const songs = accumulateListening(
    parseListeningHistory(history),
    now.listening,
  ).tracks;
  const records: VinylRecord[] = [];
  // Bound Apple concurrency as the permanent collection grows.
  for (let offset = 0; offset < songs.length; offset += 4) {
    const batch = await Promise.all(
      songs.slice(offset, offset + 4).map(async (song, index) => {
        const preview = await getListeningTrack(song);
        const current = sameListeningTrack(song, now.listening);
        return {
          ...song,
          id: current ? "now" : `song-${offset + index}`,
          coverUrl: song.coverUrl ?? preview?.coverUrl ?? null,
          appleUrl: song.appleUrl ?? preview?.trackUrl,
          previewUrl: preview?.previewUrl ?? null,
          source: current ? ("now" as const) : ("crate" as const),
        };
      }),
    );
    records.push(...batch);
  }
  return records
    .reverse()
    .sort((a, b) => Number(b.source === "now") - Number(a.source === "now"));
}
