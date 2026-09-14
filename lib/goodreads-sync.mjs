import { parseGoodreadsRss, selectLibraryBooks } from "./goodreads-rss.mjs";

/** @typedef {import("./library-data").LibraryBook} LibraryBook */
/** @typedef {import("./library-data").LibrarySnapshot} LibrarySnapshot */

const MAX_PAGES = 20;
const MAX_BYTES = 2_000_000;
const HEADERS = {
  accept: "application/rss+xml, application/xml, text/xml;q=0.9",
  "user-agent":
    "jeffrey-blog-library/1.0 (+https://jeffrey-blog-tau.vercel.app)",
};

/** Read a bounded stream, including responses without Content-Length. */
async function responseText(/** @type {Response} */ response) {
  if (!response.ok || !response.body)
    throw new Error(`Source unavailable (${response.status})`);
  if (Number(response.headers.get("content-length")) > MAX_BYTES) {
    await response.body.cancel();
    throw new Error("Source exceeds size limit");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) throw new Error("Source exceeds size limit");
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/**
 * Build in memory; callers persist only after ALL configured feeds validate.
 * URLs come exclusively from the committed configuration, never from a form.
 * @param {{ profileUrl: string, shelves: string[] }} config
 * @param {{ fetchImpl?: typeof fetch, signal?: AbortSignal }} options
 * @returns {Promise<LibrarySnapshot>}
 */
export async function buildGoodreadsSnapshot(config, options = {}) {
  const profile = new URL(config.profileUrl);
  const userId = /^\/user\/show\/(\d+)(?:-[^/]*)?\/?$/.exec(
    profile.pathname,
  )?.[1];
  if (
    profile.protocol !== "https:" ||
    profile.hostname !== "www.goodreads.com" ||
    profile.port ||
    profile.username ||
    profile.password ||
    !userId ||
    config.shelves.length !== 2 ||
    !config.shelves.includes("read") ||
    !config.shelves.includes("currently-reading")
  )
    throw new Error("Invalid Goodreads configuration");

  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  // One shared deadline covers every page, including its response body.
  const signal = AbortSignal.any([
    controller.signal,
    options.signal ?? AbortSignal.timeout(35_000),
  ]);

  async function fetchShelf(/** @type {LibraryBook["shelf"]} */ shelf) {
    /** @type {LibraryBook[]} */
    const books = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      signal.throwIfAborted();
      const url = new URL(
        `https://www.goodreads.com/review/list_rss/${userId}`,
      );
      url.searchParams.set("shelf", shelf);
      url.searchParams.set("page", String(page));
      const response = await fetchImpl(url, {
        headers: HEADERS,
        signal,
        redirect: "error",
        cache: "no-store",
      });
      const pageBooks = parseGoodreadsRss(
        await responseText(response),
        shelf,
        userId,
      );
      if (!pageBooks.length) return books;
      const before = books.length;
      for (const book of pageBooks) {
        if (!books.some((item) => item.id === book.id)) books.push(book);
      }
      // Goodreads can repeat the final page instead of returning an empty feed.
      if (books.length === before) return books;
    }
    // Never save a truncated library if pagination exceeds the supported bound.
    throw new Error("Goodreads pagination limit exceeded");
  }

  try {
    const shelves = await Promise.all(
      config.shelves.map((shelf) =>
        fetchShelf(/** @type {LibraryBook["shelf"]} */ (shelf)),
      ),
    );
    const books = selectLibraryBooks(shelves);
    // Covers are optional and share a short budget. Only Leído uses this fallback.
    const coverSignal = AbortSignal.any([signal, AbortSignal.timeout(8_000)]);
    const missing = books.filter((book) => !book.coverUrl);
    let cursor = 0;
    await Promise.all(
      Array.from({ length: Math.min(4, missing.length) }, async () => {
        while (cursor < missing.length && !coverSignal.aborted) {
          const book = missing[cursor++];
          try {
            const url = new URL("https://openlibrary.org/search.json");
            url.searchParams.set("title", book.title);
            url.searchParams.set("author", book.author);
            url.searchParams.set("limit", "1");
            const response = await fetchImpl(url, {
              headers: { accept: "application/json" },
              signal: coverSignal,
              redirect: "error",
              cache: "no-store",
            });
            const body = JSON.parse(await responseText(response));
            const coverId = body.docs?.[0]?.cover_i;
            if (Number.isSafeInteger(coverId) && coverId > 0)
              book.coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
          } catch {
            // An optional cover failure must not discard valid Goodreads data.
          }
        }
      }),
    );
    return {
      profileUrl: config.profileUrl,
      verifiedAt: new Date().toISOString(),
      books,
      currentlyReading: shelves
        .flat()
        .filter((book) => book.shelf === "currently-reading"),
    };
  } finally {
    // Stop sibling requests when any required shelf fails.
    controller.abort();
  }
}
