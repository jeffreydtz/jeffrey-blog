import type { ReadingBook } from "./ReadingShelf";

/** Validate static JSON on the server/build, with useful errors for editors. */
export function parseBooks(input: unknown): ReadingBook[] {
  if (!Array.isArray(input))
    throw new Error("books.json must contain an array");
  return input.map((value: unknown, index) => {
    const fail = (field: string): never => {
      throw new Error(
        "books.json: book " + (index + 1) + " has invalid " + field,
      );
    };
    if (!value || typeof value !== "object" || Array.isArray(value))
      return fail("record");
    const row = value as Record<string, unknown>;
    const text = (field: string, required = true): string => {
      const v = row[field];
      if (typeof v !== "string" || (required && !v.trim())) return fail(field);
      return v.trim();
    };
    const rating = (field: string): number | null => {
      const v = row[field];
      if (v === null) return null;
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 5)
        return fail(field);
      return v;
    };
    const coverUrl = text("coverUrl", false);
    if (coverUrl && !/^\/(?!\/)/.test(coverUrl)) {
      try {
        if (new URL(coverUrl).protocol !== "https:")
          return fail("coverUrl (use local paths or HTTPS)");
      } catch {
        return fail("coverUrl");
      }
    }
    const goodreadsUrl = text("goodreadsUrl", false);
    if (goodreadsUrl) {
      try {
        const url = new URL(goodreadsUrl);
        if (
          url.protocol !== "https:" ||
          !(
            url.hostname === "goodreads.com" ||
            url.hostname.endsWith(".goodreads.com")
          )
        )
          return fail("goodreadsUrl");
      } catch {
        return fail("goodreadsUrl");
      }
    }
    const year = row.publishedYear;
    if (year !== null && (typeof year !== "number" || !Number.isInteger(year)))
      return fail("publishedYear");
    if (row.review !== undefined && typeof row.review !== "string")
      return fail("review");
    return {
      title: text("title"),
      author: text("author"),
      coverUrl,
      rating: rating("rating"),
      averageRating: rating("averageRating"),
      publishedYear: year as number | null,
      goodreadsUrl,
      ...(typeof row.review === "string" ? { review: row.review } : {}),
    };
  });
}
