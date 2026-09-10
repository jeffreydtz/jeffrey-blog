/** @typedef {import("./library-data").LibraryBook} LibraryBook */
/** Decode only XML's predefined entities and numeric references. */
function decodeEntities(/** @type {string} */ input) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '\"', apos: "'" };
  return input
    .replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_, code) => {
      const point =
        code[0].toLowerCase() === "x"
          ? parseInt(code.slice(1), 16)
          : Number(code);
      if (point > 0x10ffff || point < 0 || (point >= 0xd800 && point <= 0xdfff))
        throw new Error("Invalid XML character");
      return String.fromCodePoint(point);
    })
    .replace(
      /&(amp|lt|gt|quot|apos);/g,
      (_, name) => entities[/** @type {keyof typeof entities} */ (name)],
    );
}
function stripTags(/** @type {string} */ value) {
  return value.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
}

/** This is deliberately a reader of Goodreads' known RSS fields, not a general XML parser.
 * Never evaluates markup, DTDs or external entities. Unexpected payloads fail closed. */
function field(/** @type {string} */ xml, /** @type {string} */ name) {
  const value =
    new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml)?.[1] ?? "";
  return decodeEntities(
    value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"),
  ).trim();
}

function goodreadsUrl(
  /** @type {string} */ value,
  /** @type {string} */ pathname,
) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "www.goodreads.com" ||
    !url.pathname.startsWith(pathname)
  ) {
    throw new Error("Unexpected Goodreads source URL");
  }
  // Keep the source URL as supplied by Goodreads, including its RSS attribution.
  return url.href;
}

export function parseGoodreadsRss(
  /** @type {string} */ xml,
  /** @type {LibraryBook["shelf"]} */ shelf,
  /** @type {string} */ userId,
) {
  if (
    xml.length > 2_000_000 ||
    !/<rss\s/.test(xml) ||
    !xml.includes("</rss>") ||
    /<!DOCTYPE|<!ENTITY/i.test(xml)
  ) {
    throw new Error("Invalid Goodreads RSS");
  }
  const structure = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
  if (
    (structure.match(/<item>/g) ?? []).length !==
      (structure.match(/<\/item>/g) ?? []).length ||
    (structure.match(/<channel>/g) ?? []).length !== 1 ||
    (structure.match(/<\/channel>/g) ?? []).length !== 1
  ) {
    throw new Error("Truncated Goodreads RSS");
  }
  const source = new URL(field(xml.split("<item>")[0], "link"));
  if (
    source.hostname !== "www.goodreads.com" ||
    source.pathname !== `/review/list_rss/${userId}` ||
    source.searchParams.get("shelf") !== shelf
  ) {
    throw new Error("Goodreads RSS belongs to another profile or shelf");
  }
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g), ([, item]) => {
    const id = field(item, "book_id");
    const title = stripTags(field(item, "title")).trim();
    const author = stripTags(field(item, "author_name")).trim();
    const description = field(item, "description");
    const bookLink = /<a\s+href="([^"]+)"/.exec(description)?.[1];
    if (!/^\d+$/.test(id) || !title || !author || !bookLink)
      throw new Error("Incomplete Goodreads item");
    const url = goodreadsUrl(bookLink, `/book/show/${id}`);
    if (
      new URL(url).pathname.match(/^\/book\/show\/(\d+)(?:[.\-/]|$)/)?.[1] !==
      id
    ) {
      throw new Error("Goodreads book ID does not match its URL");
    }
    const sourceUrl = goodreadsUrl(field(item, "link"), "/review/show/");
    const rawRating = field(item, "user_rating");
    if (!/^[0-5]$/.test(rawRating))
      throw new Error("Invalid Goodreads member rating");
    const rating = Number(rawRating);
    const comment = stripTags(field(item, "user_review")).trim();
    return {
      id,
      title,
      author,
      shelf,
      url,
      sourceUrl,
      ...(rating ? { rating } : {}),
      ...(comment ? { comment } : {}),
    };
  });
}

/** Reserve two places for each shelf, then fill spare places in reading order. */
export function selectLibraryBooks(/** @type {LibraryBook[][]} */ shelves) {
  /** @type {LibraryBook[]} */
  const books = [];
  const add = (/** @type {LibraryBook} */ book) => {
    if (books.length < 7 && !books.some((item) => item.id === book.id))
      books.push(book);
  };
  shelves.forEach((shelf) => shelf.slice(0, 2).forEach(add));
  shelves.flat().forEach(add);
  return books;
}
