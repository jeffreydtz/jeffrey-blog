export interface TrackPreview {
  coverUrl: string | null;
  trackUrl: string;
  previewUrl: string | null;
  title: string;
  artist: string;
  trackId: number;
}

export interface AlbumArtwork {
  coverUrl: string | null;
  appleUrl: string;
  title: string;
  artist: string;
  collectionId: number;
}

export function officialUrl(value: unknown, host: string): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === host || url.hostname.endsWith(`.${host}`))
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function normalizeMusicName(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\u2026/g, "...")
    .trim()
    .toLocaleLowerCase("en-US");
}

interface ItunesItem {
  trackName?: unknown;
  artistName?: unknown;
  trackId?: unknown;
  trackViewUrl?: unknown;
  artworkUrl100?: unknown;
  previewUrl?: unknown;
  collectionName?: unknown;
  collectionViewUrl?: unknown;
  collectionId?: unknown;
}

function isItunesList(body: unknown): body is { results: ItunesItem[] } {
  return (
    !!body &&
    typeof body === "object" &&
    "results" in body &&
    Array.isArray(body.results)
  );
}

/** Exact title/artist match only: never substitute a cover, demo or unrelated song. */
export function selectItunesTrack(
  body: unknown,
  title: string,
  artist: string,
): TrackPreview | null {
  if (!isItunesList(body)) return null;
  const normalize = normalizeMusicName;
  for (const item of body.results) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.trackName !== "string" ||
      typeof item.artistName !== "string"
    )
      continue;
    if (
      normalize(item.trackName) !== normalize(title) ||
      normalize(item.artistName) !== normalize(artist)
    )
      continue;
    const trackUrl = officialUrl(item.trackViewUrl, "music.apple.com");
    if (
      !trackUrl ||
      typeof item.trackId !== "number" ||
      !Number.isSafeInteger(item.trackId)
    )
      continue;
    return {
      title: item.trackName,
      artist: item.artistName,
      trackId: item.trackId,
      trackUrl,
      coverUrl:
        officialUrl(item.artworkUrl100, "mzstatic.com")?.replace(
          "100x100bb",
          "300x300bb",
        ) ?? null,
      previewUrl: officialUrl(item.previewUrl, "itunes.apple.com"),
    };
  }
  return null;
}

/** Exact album title/artist match; remaster suffixes are not accepted as substitutes. */
export function selectItunesAlbum(
  body: unknown,
  title: string,
  artist: string,
): AlbumArtwork | null {
  if (!isItunesList(body)) return null;
  for (const item of body.results) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.collectionName !== "string" ||
      typeof item.artistName !== "string"
    )
      continue;
    if (
      normalizeMusicName(item.collectionName) !== normalizeMusicName(title) ||
      normalizeMusicName(item.artistName) !== normalizeMusicName(artist)
    )
      continue;
    const appleUrl = officialUrl(item.collectionViewUrl, "music.apple.com");
    if (
      !appleUrl ||
      typeof item.collectionId !== "number" ||
      !Number.isSafeInteger(item.collectionId)
    )
      continue;
    return {
      title: item.collectionName,
      artist: item.artistName,
      collectionId: item.collectionId,
      appleUrl,
      coverUrl:
        officialUrl(item.artworkUrl100, "mzstatic.com")?.replace(
          "100x100bb",
          "600x600bb",
        ) ?? null,
    };
  }
  return null;
}
