import "server-only";
import { now } from "@/lib/now";
import { readEmbedCache, writeEmbedCache } from "@/lib/embed-cache";
import { selectItunesTrack, type TrackPreview } from "@/lib/itunes-track";

/** Cache is committed and keyed by the editorial song in lib/now.ts. */
export async function getNowTrack(): Promise<TrackPreview | null> {
  const { artist, title } = now.listening;
  const key = `itunes-track:v1:${artist} — ${title}`;
  const cached = readEmbedCache<TrackPreview>(key);
  if (cached) return cached;
  try {
    const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(`${artist} ${title}`)}&entity=song&limit=25`;
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const track = selectItunesTrack(await response.json(), title, artist);
    if (track) writeEmbedCache(key, track);
    return track;
  } catch (error) {
    console.warn(
      "[now-track] iTunes unavailable; cover/text fallback",
      error instanceof Error ? error.message : "",
    );
    return null;
  }
}
