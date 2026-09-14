/** Pure, versioned editorial history; no preview audio is stored here. */
export interface ListeningTrack {
  title: string;
  artist: string;
  coverUrl?: string;
  appleUrl?: string;
  spotifyUrl?: string;
  spotifyTrackUrl?: string;
}

export interface ListeningHistory {
  version: 1;
  tracks: ListeningTrack[];
}

export function listeningKey(track: ListeningTrack): string {
  const normalize = (value: string) =>
    value
      .normalize("NFKC")
      .replace(/\u2026/g, "...")
      .trim()
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("en-US");
  return JSON.stringify([normalize(track.title), normalize(track.artist)]);
}

export function parseListeningTrack(raw: unknown): ListeningTrack {
  if (!raw || typeof raw !== "object") throw new Error("Canción inválida.");
  const value = raw as Record<string, unknown>;
  if (
    typeof value.title !== "string" ||
    !value.title.trim() ||
    typeof value.artist !== "string" ||
    !value.artist.trim()
  ) {
    throw new Error("La canción necesita título y artista.");
  }
  const track: ListeningTrack = {
    title: value.title.trim(),
    artist: value.artist.trim(),
  };
  for (const field of [
    "coverUrl",
    "appleUrl",
    "spotifyUrl",
    "spotifyTrackUrl",
  ] as const) {
    const input = value[field];
    if (input == null || input === "") continue;
    if (typeof input !== "string") throw new Error(`Enlace ${field} inválido.`);
    const url = new URL(input);
    if (url.protocol !== "https:" || url.username || url.password || url.port) {
      throw new Error(`Enlace ${field} inválido.`);
    }
    if (
      field === "appleUrl" &&
      (url.hostname !== "music.apple.com" ||
        !/^\/[a-z]{2}\/(?:album|song)\//.test(url.pathname))
    ) {
      throw new Error(
        "El enlace Apple debe ser una canción de music.apple.com.",
      );
    }
    if (
      (field === "spotifyUrl" || field === "spotifyTrackUrl") &&
      (url.hostname !== "open.spotify.com" ||
        !new RegExp(
          `^/(?:intl-[a-z]{2}/)?${field === "spotifyTrackUrl" ? "track" : "album"}/[A-Za-z0-9]{10,40}$`,
        ).test(url.pathname))
    ) {
      throw new Error(`Enlace ${field} inválido.`);
    }
    track[field] = url.href;
  }
  return track;
}

function providerIds(track: ListeningTrack): string[] {
  const ids: string[] = [];
  if (track.spotifyTrackUrl)
    ids.push(
      `spotify:${new URL(track.spotifyTrackUrl).pathname.split("/").pop()}`,
    );
  if (track.appleUrl) {
    const url = new URL(track.appleUrl);
    const id =
      url.searchParams.get("i") ??
      (url.pathname.includes("/song/") ? url.pathname.split("/").pop() : null);
    if (id && /^\d+$/.test(id)) ids.push(`apple:${id}`);
  }
  return ids;
}

export function sameListeningTrack(
  a: ListeningTrack,
  b: ListeningTrack,
): boolean {
  if (listeningKey(a) === listeningKey(b)) return true;
  const ids = providerIds(a);
  return providerIds(b).some((id) => ids.includes(id));
}

export function parseListeningHistory(raw: unknown): ListeningHistory {
  if (
    !raw ||
    typeof raw !== "object" ||
    !("version" in raw) ||
    raw.version !== 1 ||
    !("tracks" in raw) ||
    !Array.isArray(raw.tracks)
  ) {
    throw new Error(
      "Historial de canciones inválido; no se reemplazó el archivo.",
    );
  }
  return { version: 1, tracks: raw.tracks.map(parseListeningTrack) };
}

/** Existing entries retain their position; new songs append, metadata can improve. */
export function accumulateListening(
  history: ListeningHistory,
  ...songs: ListeningTrack[]
): ListeningHistory {
  const tracks: ListeningTrack[] = [];
  for (const raw of [...history.tracks, ...songs]) {
    const song = parseListeningTrack(raw);
    const index = tracks.findIndex((entry) => sameListeningTrack(entry, song));
    if (index < 0) tracks.push(song);
    else tracks[index] = { ...tracks[index], ...song };
  }
  return { version: 1, tracks };
}

/** Read the generated JSON string literals without executing repository code. */
export function listeningFromNowSource(source: string): ListeningTrack {
  const json = source.match(
    /export const now[^=]*=\s*(\{[\s\S]*\});?\s*$/,
  )?.[1];
  if (json) {
    try {
      const data = JSON.parse(json) as { listening?: unknown };
      return parseListeningTrack(data.listening);
    } catch {
      // Legacy hand-edited TypeScript uses bare keys; read its string fields below.
    }
  }
  const object = source.match(
    /export const now[^=]*=\s*\{\s*listening:\s*\{([\s\S]*?)^\s*\},/m,
  )?.[1];
  if (!object)
    throw new Error(
      "No se pudo leer la canción anterior; no se guardó ningún cambio.",
    );
  const fields: Record<string, unknown> = {};
  for (const field of [
    "title",
    "artist",
    "coverUrl",
    "appleUrl",
    "spotifyUrl",
    "spotifyTrackUrl",
  ]) {
    const literal = object.match(
      new RegExp(`^\\s*${field}:\\s*("(?:[^"\\\\]|\\\\.)*")\\s*,?\\s*$`, "m"),
    )?.[1];
    if (literal) fields[field] = JSON.parse(literal);
  }
  return parseListeningTrack(fields);
}
