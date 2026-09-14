import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
// Execute the real TS/TSX modules with local data/IO boundaries supplied by each test.
async function load(relative, mocks = {}) {
  const source = await fs.readFile(new URL(relative, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  const loaded = { exports: {} };
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith("@/") || name === "server-only") {
      throw new Error(`Unexpected IO dependency: ${name}`);
    }
    return require(name);
  };
  new Function("require", "module", "exports", outputText)(
    localRequire,
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}

const { ui } = await load("../lib/ui.ts");
const music = await load("../components/ui/MusicPreview.tsx", {
  "@/lib/ui": { ui },
});
const profileUrl = "https://www.goodreads.com/user/show/123-test";
const manual = {
  listening: { title: "Test song", artist: "Test artist" },
  reading: {
    title: "Wrong manual book",
    author: "Wrong author",
    coverUrl: "https://example.com/wrong.jpg",
  },
};
const track = {
  coverUrl: "https://example.com/song.jpg",
  trackUrl: "https://music.apple.com/test",
  previewUrl: "https://audio-ssl.itunes.apple.com/test.m4a",
};
const book = {
  id: "12",
  title: "Current & real",
  author: "Current author",
  shelf: "currently-reading",
  url: "https://www.goodreads.com/book/show/12",
  sourceUrl: "https://www.goodreads.com/review/show/34",
};

async function render(currentlyReading, selectedTrack = track) {
  const { NowWidget } = await load("../components/ui/NowWidget.tsx", {
    "@/components/ui/MusicPreview": music,
    "@/lib/ui": { ui },
    "@/lib/now": { now: manual },
    "@/lib/goodreads": {
      getLibrary: () => ({ profileUrl, books: [], currentlyReading }),
    },
    "@/lib/now-track": { getNowTrack: async () => selectedTrack },
  });
  return renderToStaticMarkup(await NowWidget());
}

test("Footer SSR shows an honest empty state for empty and legacy snapshots", async () => {
  for (const reading of [[], undefined]) {
    const html = await render(reading);
    assert.ok(html.includes(ui.now.noReading));
    assert.ok(html.includes(`href="${profileUrl}"`));
    assert.doesNotMatch(
      html,
      /Wrong manual|wrong\.jpg|Fragmento oficial|30 segundos/,
    );
    assert.match(html, /<audio[^>]+preload="none"/);
    assert.match(html, /Reproducir fragmento autorizado/);
    assert.ok(html.includes(track.trackUrl));
  }
});

test("Footer SSR selects the first RSS book and keeps its metadata and cover together", async () => {
  const html = await render([
    { ...book, coverUrl: "https://i.gr-assets.com/actual.jpg" },
    { ...book, id: "13", title: "Second book" },
  ]);
  assert.match(html, /Current &amp; real — Current author/);
  assert.ok(html.includes(`href="${book.url}"`));
  assert.match(html, /i\.gr-assets\.com\/actual\.jpg/);
  assert.doesNotMatch(html, /Wrong manual|wrong\.jpg|Second book/);
});

test("Missing current-book cover never borrows the manual cover; absent song metadata still renders", async () => {
  const html = await render([book], null);
  assert.match(html, /Current &amp; real — Current author/);
  assert.match(html, /Test song/);
  assert.doesNotMatch(html, /<img|<audio|wrong\.jpg/);
  assert.ok(html.includes(`href="${book.url}"`));
});

test("A profile change hides both shelves from the old snapshot", async () => {
  const { getLibrary } = await load("../lib/goodreads.ts", {
    "server-only": {},
    "@/content/data/goodreads.json": {
      profileUrl: "https://www.goodreads.com/user/show/456-other",
      books: [book],
      currentlyReading: [book],
    },
    "@/lib/library-data": { goodreadsProfileUrl: profileUrl },
  });
  assert.equal(getLibrary().profileUrl, profileUrl);
  assert.deepEqual(getLibrary().books, []);
  assert.equal(getLibrary().currentlyReading?.[0], undefined);
});
