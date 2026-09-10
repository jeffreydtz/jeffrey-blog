export interface TrackPreview {
  coverUrl: string | null;
  trackUrl: string;
  previewUrl: string | null;
  title: string;
  artist: string;
  trackId: number;
}

function officialUrl(value: unknown, host: string): string | null {
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

/** Exact title/artist match only: never substitute a cover, demo or unrelated song. */
export function selectItunesTrack(
  body: unknown,
  title: string,
  artist: string,
): TrackPreview | null {
  if (
    !body ||
    typeof body !== "object" ||
    !("results" in body) ||
    !Array.isArray(body.results)
  )
    return null;
  const normalize = (value: string) =>
    value.normalize("NFKC").trim().toLocaleLowerCase("en-US");
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
    if (!trackUrl || !Number.isSafeInteger(item.trackId)) continue;
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
