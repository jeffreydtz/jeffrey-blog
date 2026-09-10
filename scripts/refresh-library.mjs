// Node >=20; no additional package or API key.
import fs from "node:fs/promises";
import config from "../content/data/goodreads-config.json" with { type: "json" };
import {
  parseGoodreadsRss,
  selectLibraryBooks,
} from "../lib/goodreads-rss.mjs";

const { profileUrl: goodreadsProfileUrl, shelves: libraryShelves } = config;

const userId = /\/user\/show\/(\d+)/.exec(goodreadsProfileUrl)?.[1];
if (!userId) throw new Error("Invalid Goodreads profile URL");

const HEADERS = {
  accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  "user-agent":
    "jeffrey-blog-library/1.0 (+https://jeffrey-blog-tau.vercel.app)",
};

const MAX_PAGES = 20;

async function fetchShelf(/** @type {string} */ shelf) {
  /** @type {import("../lib/library-data").LibraryBook[]} */
  const books = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(`https://www.goodreads.com/review/list_rss/${userId}`);
    url.searchParams.set("shelf", shelf);
    url.searchParams.set("page", String(page));
    const response = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok)
      throw new Error(`Goodreads ${shelf} p${page}: HTTP ${response.status}`);
    const pageBooks = parseGoodreadsRss(await response.text(), shelf, userId);
    if (pageBooks.length === 0) break;
    const before = books.length;
    for (const book of pageBooks) {
      if (!books.some((item) => item.id === book.id)) books.push(book);
    }
    if (books.length === before) break;
  }
  return books;
}

const shelves = await Promise.all(libraryShelves.map(fetchShelf));
const snapshot = {
  profileUrl: goodreadsProfileUrl,
  verifiedAt: new Date().toISOString(),
  books: selectLibraryBooks(shelves),
};
// Fetch/parse every configured shelf before changing the last valid snapshot.
await fs.writeFile(
  new URL("../content/data/goodreads.json.tmp", import.meta.url),
  `${JSON.stringify(snapshot, null, 2)}\n`,
);
await fs.rename(
  new URL("../content/data/goodreads.json.tmp", import.meta.url),
  new URL("../content/data/goodreads.json", import.meta.url),
);
console.log(
  `Goodreads: ${snapshot.books.length} read books; snapshot updated.`,
);
