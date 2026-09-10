/**
 * Cajón editorial de vinilos. `content/data/vinyl.json` se edita a mano;
 * el disco "en el plato" se antepone desde lib/now.ts (widget Ahora).
 */

export interface VinylAlbumDraft {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  spotifyUrl?: string;
  note?: string;
}

export interface VinylRecord {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  spotifyUrl?: string;
  appleUrl?: string;
  previewUrl: string | null;
  note?: string;
  source: "now" | "crate";
}

const SPOTIFY_ALBUM =
  /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?album\/[A-Za-z0-9]{10,40}(?:\?.*)?$/;

function requireString(value: unknown, field: string, id: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`[vinyl] álbum ${id}: "${field}" requerido`);
  }
  return value.trim();
}

export function parseVinylCrate(raw: unknown): VinylAlbumDraft[] {
  if (!raw || typeof raw !== "object" || !("albums" in raw)) {
    throw new Error('[vinyl] vinyl.json: se espera { "albums": [...] }');
  }
  if (!Array.isArray(raw.albums)) {
    throw new Error('[vinyl] vinyl.json: "albums" debe ser un arreglo');
  }
  const seen = new Set<string>();
  return raw.albums.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`[vinyl] vinyl.json: álbum ${index} inválido`);
    }
    const id = requireString(
      "id" in item ? item.id : undefined,
      "id",
      String(index),
    );
    if (id === "now") {
      throw new Error('[vinyl] id "now" está reservado para lib/now.ts');
    }
    if (seen.has(id)) {
      throw new Error(`[vinyl] id duplicado: ${id}`);
    }
    seen.add(id);
    const draft: VinylAlbumDraft = {
      id,
      title: requireString(
        "title" in item ? item.title : undefined,
        "title",
        id,
      ),
      artist: requireString(
        "artist" in item ? item.artist : undefined,
        "artist",
        id,
      ),
    };
    if ("coverUrl" in item && item.coverUrl != null && item.coverUrl !== "") {
      const cover = requireString(item.coverUrl, "coverUrl", id);
      if (!cover.startsWith("https://")) {
        throw new Error(`[vinyl] ${id}: coverUrl debe ser https`);
      }
      draft.coverUrl = cover;
    }
    if (
      "spotifyUrl" in item &&
      item.spotifyUrl != null &&
      item.spotifyUrl !== ""
    ) {
      const url = requireString(item.spotifyUrl, "spotifyUrl", id);
      if (!SPOTIFY_ALBUM.test(url)) {
        throw new Error(
          `[vinyl] ${id}: spotifyUrl debe ser https://open.spotify.com/album/{id}`,
        );
      }
      draft.spotifyUrl = url;
    }
    if ("note" in item && item.note != null && item.note !== "") {
      draft.note = requireString(item.note, "note", id);
    }
    return draft;
  });
}

function catalogKey(title: string, artist: string): string {
  const normalize = (value: string) =>
    value
      .normalize("NFKC")
      .replace(/\u2026/g, "...")
      .trim()
      .toLocaleLowerCase("en-US");
  return `${normalize(title)}|${normalize(artist)}`;
}

/** Ahora va primero. Si el cajón ya tiene el mismo título+artista, no se duplica. */
export function assembleVinyl(
  nowPlaying: VinylRecord,
  crate: VinylRecord[],
): VinylRecord[] {
  const nowKey = catalogKey(nowPlaying.title, nowPlaying.artist);
  const rest = crate.filter(
    (record) => catalogKey(record.title, record.artist) !== nowKey,
  );
  return [nowPlaying, ...rest];
}
