import "server-only";
import crate from "@/content/data/vinyl.json";
import { now } from "@/lib/now";
import { getNowCovers } from "@/lib/now-covers";
import { getNowTrack } from "@/lib/now-track";
import { resolveAlbumArtwork, resolveAlbumPreview } from "@/lib/vinyl-covers";
import {
  assembleVinyl,
  parseVinylCrate,
  type VinylRecord,
} from "@/lib/vinyl-data";

export type { VinylRecord } from "@/lib/vinyl-data";

/** Disco en el plato (Ahora) + cajón editorial. Portadas en build, cacheadas. */
export async function getVinylRecords(): Promise<VinylRecord[]> {
  const albums = parseVinylCrate(crate);
  const [covers, track, artwork] = await Promise.all([
    getNowCovers(),
    getNowTrack(),
    Promise.all(albums.map(resolveAlbumArtwork)),
  ]);
  const previews = await Promise.all(
    albums.map((album, index) => resolveAlbumPreview(album, artwork[index])),
  );

  const nowPlaying: VinylRecord = {
    id: "now",
    title: now.listening.title,
    artist: now.listening.artist,
    coverUrl: now.listening.coverUrl ?? track?.coverUrl ?? covers.listening,
    appleUrl: track?.trackUrl,
    spotifyUrl: now.listening.spotifyUrl,
    spotifyTrackUrl: now.listening.spotifyTrackUrl,
    previewUrl: track?.previewUrl ?? null,
    source: "now",
  };

  const crateRecords: VinylRecord[] = albums.map((album, index) => ({
    id: album.id,
    title: album.title,
    artist: album.artist,
    coverUrl: album.coverUrl ?? artwork[index]?.coverUrl ?? null,
    spotifyUrl: album.spotifyUrl,
    spotifyTrackUrl: album.spotifyTrackUrl,
    appleUrl: artwork[index]?.appleUrl || undefined,
    previewUrl: previews[index],
    note: album.note,
    source: "crate",
  }));

  return assembleVinyl(nowPlaying, crateRecords);
}
