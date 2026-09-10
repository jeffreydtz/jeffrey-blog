// Node >=20; no additional package or API key.
import fs from "node:fs/promises";
import config from "../content/data/goodreads-config.json" with { type: "json" };
const { profileUrl: goodreadsProfileUrl, shelves: libraryShelves } = config;
import {
  parseGoodreadsRss,
  selectLibraryBooks,
} from "../lib/goodreads-rss.mjs";

const userId = /\/user\/show\/(\d+)/.exec(goodreadsProfileUrl)?.[1];
if (!userId) throw new Error("Invalid Goodreads profile URL");
const shelves = await Promise.all(
  libraryShelves.map(async (shelf) => {
    const response = await fetch(
      `https://www.goodreads.com/review/list_rss/${userId}?shelf=${shelf}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok)
      throw new Error(`Goodreads ${shelf}: HTTP ${response.status}`);
    return parseGoodreadsRss(await response.text(), shelf, userId);
  }),
);
const snapshot = {
  profileUrl: goodreadsProfileUrl,
  verifiedAt: new Date().toISOString(),
  books: selectLibraryBooks(shelves),
};
// Fetch/parse every shelf before changing the last valid committed snapshot.
const target = new URL("../content/data/goodreads.json", import.meta.url);
await fs.writeFile(
  new URL("../content/data/goodreads.json.tmp", import.meta.url),
  `${JSON.stringify(snapshot, null, 2)}\n`,
);
await fs.rename(
  new URL("../content/data/goodreads.json.tmp", import.meta.url),
  target,
);
console.log(
  `Goodreads: ${snapshot.books.length} verified books; snapshot updated.`,
);
