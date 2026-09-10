import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";
import {
  parseGoodreadsRss,
  selectLibraryBooks,
} from "../lib/goodreads-rss.mjs";

const source = await fs.readFile(
  new URL("../lib/itunes-track.ts", import.meta.url),
  "utf8",
);
const output = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
const { selectItunesTrack } = await import(
  `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`
);

// Synthetic fixture data belongs only in tests, never in the personal snapshot.
const item = (changes = {}) => {
  const fields = {
    book_id: "12",
    title: "Test &amp; Book",
    author_name: "Test Author",
    link: "https://www.goodreads.com/review/show/34?utm_source=rss",
    description:
      '<![CDATA[<a href="https://www.goodreads.com/book/show/12.Test">Book</a>]]>',
    user_rating: "4",
    average_rating: "1.2",
    user_review: "<![CDATA[Useful<br/>note]]>",
    ...changes,
  };
  return `<item>${Object.entries(fields)
    .map(([name, value]) => `<${name}>${value}</${name}>`)
    .join("")}</item>`;
};
const feed = (items = "", shelf = "read", user = "123") =>
  `<?xml version="1.0"?><rss version="2.0"><channel><link><![CDATA[https://www.goodreads.com/review/list_rss/${user}?shelf=${shelf}]]></link>${items}</channel></rss>`;
const parse = (xml) => parseGoodreadsRss(xml, "read", "123");

test("Goodreads accepts a genuinely empty public shelf", () =>
  assert.deepEqual(parse(feed()), []));
test("Goodreads keeps the member rating, decoded text, source and requested shelf", () => {
  const [book] = parse(feed(item()));
  assert.equal(book.rating, 4);
  assert.equal(book.title, "Test & Book");
  assert.equal(book.comment, "Useful\nnote");
  assert.equal(book.shelf, "read");
  assert.equal(
    book.sourceUrl,
    "https://www.goodreads.com/review/show/34?utm_source=rss",
  );
});
test("Goodreads omits rating zero and empty comments", () => {
  const [book] = parse(feed(item({ user_rating: "0", user_review: "" })));
  assert.equal("rating" in book, false);
  assert.equal("comment" in book, false);
});
test("Goodreads rejects a sign-in page and truncated RSS", () => {
  assert.throws(() => parse("<html><title>Sign in</title></html>"));
  assert.throws(() => parse(feed(item()).replace("</rss>", "")));
});
test("Goodreads rejects mismatched profile and shelf", () => {
  assert.throws(() => parse(feed(item(), "read", "999")));
  assert.throws(() => parse(feed(item(), "to-read")));
});
test("Goodreads rejects a missing required title or invalid personal rating", () => {
  assert.throws(() => parse(feed(item({ title: "" }))));
  assert.throws(() => parse(feed(item({ user_rating: "6" }))));
});
test("Goodreads rejects external book and review links", () => {
  assert.throws(() =>
    parse(
      feed(
        item({
          description:
            '<![CDATA[<a href="https://evil.test/book/show/12">Book</a>]]>',
        }),
      ),
    ),
  );
  assert.throws(() =>
    parse(
      feed(
        item({ link: "https://www.goodreads.com.evil.test/review/show/34" }),
      ),
    ),
  );
});
test("Goodreads rejects DTDs, entity declarations and oversized payloads", () => {
  assert.throws(() =>
    parse(`<!DOCTYPE rss SYSTEM "file:///etc/passwd">${feed()}`),
  );
  assert.throws(() => parse(`<!ENTITY test "x">${feed()}`));
  assert.throws(() => parse(feed(" ".repeat(2_000_001))));
});
test("Goodreads rejects unclosed items instead of silently replacing books with empty data", () => {
  assert.throws(() => parse(feed(item().replace("</item>", ""))));
});
test("Goodreads rejects a book URL whose numeric ID only shares a prefix", () => {
  assert.throws(() =>
    parse(
      feed(
        item({
          description:
            '<![CDATA[<a href="https://www.goodreads.com/book/show/1234.Other">Other</a>]]>',
        }),
      ),
    ),
  );
});
test("Committed snapshot is the full read shelf, never to-read", async () => {
  const snapshot = JSON.parse(
    await fs.readFile(
      new URL("../content/data/goodreads.json", import.meta.url),
      "utf8",
    ),
  );
  assert.ok(snapshot.books.length > 7);
  assert.equal(
    snapshot.books.every((book) => book.shelf === "read"),
    true,
  );
  assert.ok(snapshot.books.some((book) => Boolean(book.comment)));
  assert.ok(snapshot.books.some((book) => typeof book.rating === "number"));
});
test("Selection keeps the full read shelf, drops other shelves and duplicates", () => {
  const read = Array.from({ length: 12 }, (_, index) => ({
    id: String(index),
    shelf: "read",
  }));
  const extra = [
    { id: "0", shelf: "read" },
    { id: "99", shelf: "to-read" },
    { id: "88", shelf: "currently-reading" },
  ];
  const selected = selectLibraryBooks([read, extra]);
  assert.equal(selected.length, 12);
  assert.equal(new Set(selected.map((book) => book.id)).size, 12);
  assert.equal(
    selected.every((book) => book.shelf === "read"),
    true,
  );
  assert.deepEqual(selectLibraryBooks([[], [], []]), []);
});

const track = (changes = {}) => ({
  trackName: "Test Song",
  artistName: "Test Artist",
  trackId: 12,
  trackViewUrl: "https://music.apple.com/us/album/test/1?i=12",
  artworkUrl100: "https://is1-ssl.mzstatic.com/image/100x100bb.jpg",
  previewUrl: "https://audio-ssl.itunes.apple.com/test.m4a",
  ...changes,
});
const select = (results) =>
  selectItunesTrack({ results }, "Test Song", "Test Artist");
test("iTunes only accepts the exact title and artist, rejecting demo and cover versions", () => {
  assert.equal(select([track({ artistName: "Cover Artist" })]), null);
  assert.equal(select([track({ trackName: "Test Song (Demo)" })]), null);
  assert.equal(select([track({ trackName: "Unrelated Song" })]), null);
});
test("iTunes chooses the valid match after unrelated results and normalizes spacing/case", () => {
  const result = select([
    track({ artistName: "Other" }),
    track({ trackName: " test song " }),
  ]);
  assert.equal(result.trackId, 12);
  assert.equal(
    result.previewUrl,
    "https://audio-ssl.itunes.apple.com/test.m4a",
  );
  assert.match(result.coverUrl, /300x300bb/);
});
test("iTunes rejects invalid metadata and untrusted track URL hosts", () => {
  for (const value of [null, {}, { results: {} }, { results: [null] }]) {
    assert.equal(selectItunesTrack(value, "Test Song", "Test Artist"), null);
  }
  assert.equal(select([track({ trackId: "12" })]), null);
  assert.equal(
    select([
      track({ trackViewUrl: "https://music.apple.com.evil.test/track" }),
    ]),
    null,
  );
  assert.equal(select([track({ trackViewUrl: "javascript:alert(1)" })]), null);
});
test("iTunes safely degrades bad preview/artwork URLs to an official track link", () => {
  for (const url of [
    "https://itunes.apple.com.evil.test/test.m4a",
    "http://audio-ssl.itunes.apple.com/test.m4a",
    "not a url",
  ]) {
    const result = select([track({ previewUrl: url, artworkUrl100: url })]);
    assert.equal(result.previewUrl, null);
    assert.equal(result.coverUrl, null);
    assert.ok(result.trackUrl.startsWith("https://music.apple.com/"));
  }
});
