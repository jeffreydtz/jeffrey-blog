import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";

const source = await fs.readFile(
  new URL("../lib/vinyl-data.ts", import.meta.url),
  "utf8",
);
const output = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
const { parseVinylCrate, assembleVinyl, parseSpotifyUrl, spotifyEmbedFor } =
  await import(
    `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`
  );

const nowPlaying = {
  id: "now",
  title: "I Wish It Would Rain Down",
  artist: "Phil Collins",
  coverUrl: null,
  previewUrl: null,
  source: "now",
};

test("Committed crate has unique ids, titles, artists and https Spotify album URLs", async () => {
  const raw = JSON.parse(
    await fs.readFile(
      new URL("../content/data/vinyl.json", import.meta.url),
      "utf8",
    ),
  );
  const albums = parseVinylCrate(raw);
  assert.ok(albums.length >= 1);
  assert.equal(new Set(albums.map((album) => album.id)).size, albums.length);
  assert.equal(
    albums.every((album) => album.id && album.title && album.artist),
    true,
  );
  for (const album of albums) {
    if (album.spotifyUrl) {
      assert.match(
        album.spotifyUrl,
        /^https:\/\/open\.spotify\.com\/album\/[A-Za-z0-9]+/,
      );
    }
  }
});

test("Crate parse rejects reserved now id, duplicates and untrusted URLs", () => {
  const albums = (items) => ({ albums: items });
  const valid = {
    id: "in-a-silent-way",
    title: "In a Silent Way",
    artist: "Miles Davis",
  };
  assert.throws(() => parseVinylCrate({ albums: [{ ...valid, id: "now" }] }));
  assert.throws(() => parseVinylCrate(albums([valid, valid])));
  assert.throws(() =>
    parseVinylCrate(
      albums([{ ...valid, coverUrl: "http://example.com/cover.jpg" }]),
    ),
  );
  assert.throws(() =>
    parseVinylCrate(
      albums([
        { ...valid, spotifyUrl: "https://open.spotify.com/track/abc1234567" },
      ]),
    ),
  );
  assert.throws(() =>
    parseVinylCrate(
      albums([
        {
          ...valid,
          spotifyTrackUrl: "https://open.spotify.com/album/abc1234567",
        },
      ]),
    ),
  );
  const withTrack = parseVinylCrate(
    albums([
      {
        ...valid,
        spotifyUrl: "https://open.spotify.com/album/0Hs3BomCdwIWRhgT57x22T",
        spotifyTrackUrl:
          "https://open.spotify.com/track/3B4q6KbAgs1vGPQfhSxWLd",
      },
    ]),
  );
  assert.equal(
    withTrack[0].spotifyTrackUrl,
    "https://open.spotify.com/track/3B4q6KbAgs1vGPQfhSxWLd",
  );
});

test("Now playing is prepended and matching crate rows are not duplicated", () => {
  const crate = [
    {
      id: "in-a-silent-way",
      title: "In a Silent Way",
      artist: "Miles Davis",
      coverUrl: null,
      previewUrl: null,
      source: "crate",
    },
    {
      id: "rain",
      title: "I Wish It Would Rain Down",
      artist: "Phil Collins",
      coverUrl: null,
      previewUrl: null,
      source: "crate",
    },
  ];
  const records = assembleVinyl(nowPlaying, crate);
  assert.equal(records[0].source, "now");
  assert.equal(records.length, 2);
  assert.equal(records[1].id, "in-a-silent-way");
});

test("Spotify embed prefers a track URL over the album URL", () => {
  assert.deepEqual(
    parseSpotifyUrl("https://open.spotify.com/album/0Hs3BomCdwIWRhgT57x22T"),
    { kind: "album", id: "0Hs3BomCdwIWRhgT57x22T" },
  );
  assert.deepEqual(
    parseSpotifyUrl(
      "https://open.spotify.com/intl-es/track/3B4q6KbAgs1vGPQfhSxWLd",
    ),
    { kind: "track", id: "3B4q6KbAgs1vGPQfhSxWLd" },
  );
  const record = {
    id: "in-a-silent-way",
    title: "In a Silent Way",
    artist: "Miles Davis",
    coverUrl: null,
    previewUrl: "https://audio-ssl.itunes.apple.com/test.m4a",
    spotifyUrl: "https://open.spotify.com/album/0Hs3BomCdwIWRhgT57x22T",
    spotifyTrackUrl: "https://open.spotify.com/track/3B4q6KbAgs1vGPQfhSxWLd",
    source: "crate",
  };
  assert.deepEqual(spotifyEmbedFor(record), {
    kind: "track",
    id: "3B4q6KbAgs1vGPQfhSxWLd",
  });
});
