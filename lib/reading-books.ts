import { parseBooks } from "@/components/reading/parseBooks";
import type { ReadingBook } from "@/components/reading/ReadingShelf";
import type { LibraryBook } from "@/lib/library-data";

/** Map the committed Goodreads read-shelf snapshot onto the Astra ReadingBook shape. */
export function toReadingBooks(books: LibraryBook[]): ReadingBook[] {
  return parseBooks(
    books.map((book) => ({
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl ?? "",
      rating: book.rating ?? null,
      averageRating: book.averageRating ?? null,
      publishedYear: book.publishedYear ?? null,
      goodreadsUrl: book.url,
      review: book.comment || book.description || "",
    })),
  );
}
