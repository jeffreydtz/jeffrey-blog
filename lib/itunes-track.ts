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

export interface AlbumLeadPreview {
  previewUrl: string | null;
  trackUrl: string | null;
  trackName: string;
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
  trackNumber?: unknown;
  discNumber?: unknown;
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

function readAlbumItem(item: ItunesItem): AlbumArtwork | null {
  if (
    typeof item.collectionName !== "string" ||
    typeof item.artistName !== "string"
  )
    return null;
  const appleUrl = officialUrl(item.collectionViewUrl, "music.apple.com");
  if (
    !appleUrl ||
    typeof item.collectionId !== "number" ||
    !Number.isSafeInteger(item.collectionId)
  )
    return null;
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

/** Remainder after the editorial title: " (Remastered)", " [Deluxe Edition]", etc. */
function isEditionSuffix(remainder: string): boolean {
  return /^\s*[\(\[].+[\)\]]$/.test(remainder);
}

/**
 * Prefer an exact album title/artist. If Apple only has a remaster/deluxe of
 * that same album, accept the first such edition — never a different work.
 */
export function selectItunesAlbum(
  body: unknown,
  title: string,
  artist: string,
): AlbumArtwork | null {
  if (!isItunesList(body)) return null;
  const wantTitle = normalizeMusicName(title);
  const wantArtist = normalizeMusicName(artist);
  let edition: AlbumArtwork | null = null;
  for (const item of body.results) {
    if (!item || typeof item !== "object") continue;
    if (normalizeMusicName(String(item.artistName ?? "")) !== wantArtist)
      continue;
    const name = normalizeMusicName(String(item.collectionName ?? ""));
    const parsed = readAlbumItem(item);
    if (!parsed) continue;
    if (name === wantTitle) return parsed;
    if (
      !edition &&
      name.startsWith(wantTitle) &&
      isEditionSuffix(name.slice(wantTitle.length))
    ) {
      edition = parsed;
    }
  }
  return edition;
}

/**
 * First song of an album lookup (`entity=song`), in disc/track order.
 * Used for crate previews — never a "popular" substitute. If that lead
 * cut has no preview, walk forward until one does.
 */
export function selectItunesAlbumLeadTrack(
  body: unknown,
  collectionId: number,
  artist: string,
): AlbumLeadPreview | null {
  if (!isItunesList(body) || !Number.isSafeInteger(collectionId)) return null;
  const wantArtist = normalizeMusicName(artist);
  const tracks: Array<{
    disc: number;
    track: number;
    item: ItunesItem;
    name: string;
  }> = [];
  for (const item of body.results) {
    if (!item || typeof item !== "object") continue;
    if (item.collectionId !== collectionId) continue;
    if (typeof item.trackName !== "string" || item.trackName.trim() === "")
      continue;
    if (typeof item.trackId !== "number" || !Number.isSafeInteger(item.trackId))
      continue;
    if (normalizeMusicName(String(item.artistName ?? "")) !== wantArtist)
      continue;
    tracks.push({
      disc: typeof item.discNumber === "number" ? item.discNumber : 1,
      track: typeof item.trackNumber === "number" ? item.trackNumber : 1,
      item,
      name: item.trackName,
    });
  }
  tracks.sort((a, b) => a.disc - b.disc || a.track - b.track);
  const lead =
    tracks.find(
      (row) => officialUrl(row.item.previewUrl, "itunes.apple.com") !== null,
    ) ?? tracks[0];
  if (!lead) return null;
  return {
    trackName: lead.name,
    trackUrl: officialUrl(lead.item.trackViewUrl, "music.apple.com"),
    previewUrl: officialUrl(lead.item.previewUrl, "itunes.apple.com"),
  };
}
