import "server-only";
import { readEmbedCache, writeEmbedCache } from "@/lib/embed-cache";
import {
  selectItunesAlbum,
  selectItunesAlbumLeadTrack,
  type AlbumArtwork,
} from "@/lib/itunes-track";
import type { VinylAlbumDraft } from "@/lib/vinyl-data";

const TIMEOUT_MS = 8_000;

async function lookupItunesAlbum(
  album: VinylAlbumDraft,
): Promise<AlbumArtwork | null> {
  const key = `itunes-album:v1:${album.artist} — ${album.title}`;
  const cached = readEmbedCache<AlbumArtwork>(key);
  if (cached) return cached;
  try {
    const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(`${album.artist} ${album.title}`)}&entity=album&limit=25`;
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const artwork = selectItunesAlbum(
      await response.json(),
      album.title,
      album.artist,
    );
    if (artwork) writeEmbedCache(key, artwork);
    return artwork;
  } catch (error) {
    console.warn(
      `[vinyl-covers] ${key}: ${error instanceof Error ? error.message : String(error)} — rótulo tipográfico`,
    );
    return null;
  }
}

/**
 * Portadas de álbum del cajón, misma disciplina que lib/now-covers.ts:
 * cache commiteado en `.cache/embeds/`; red caída → sin portada, el disco
 * queda con rótulo tipográfico. El build nunca falla por iTunes.
 * `coverUrl` manual gana; iTunes igual puede aportar el enlace de Apple.
 */
export async function resolveAlbumArtwork(
  album: VinylAlbumDraft,
): Promise<AlbumArtwork | null> {
  const itunes = await lookupItunesAlbum(album);
  if (album.coverUrl) {
    return {
      title: album.title,
      artist: album.artist,
      collectionId: itunes?.collectionId ?? 0,
      appleUrl: itunes?.appleUrl ?? "",
      coverUrl: album.coverUrl,
    };
  }
  return itunes;
}

/**
 * Preview de 30s del primer corte del álbum (lookup iTunes `entity=song`).
 * Cache `itunes-album-preview:v1:{collectionId}`. Sin collectionId o sin
 * preview → null; el brazo y el botón degradan, el embed de Spotify queda.
 */
export async function resolveAlbumPreview(
  album: VinylAlbumDraft,
  artwork: AlbumArtwork | null,
): Promise<string | null> {
  const collectionId = artwork?.collectionId;
  if (!collectionId) return null;
  const key = `itunes-album-preview:v1:${collectionId}`;
  const cached = readEmbedCache<{ previewUrl: string }>(key);
  if (cached) return cached.previewUrl;
  try {
    const endpoint = `https://itunes.apple.com/lookup?id=${collectionId}&entity=song`;
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const lead = selectItunesAlbumLeadTrack(
      await response.json(),
      collectionId,
      album.artist,
    );
    const previewUrl = lead?.previewUrl ?? null;
    if (previewUrl) writeEmbedCache(key, { previewUrl });
    return previewUrl;
  } catch (error) {
    console.warn(
      `[vinyl-covers] ${key}: ${error instanceof Error ? error.message : String(error)} — sin preview`,
    );
    return null;
  }
}
