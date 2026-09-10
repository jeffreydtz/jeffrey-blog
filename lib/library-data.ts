/** Public Goodreads fields only; rating is the member's score, never the average. */
export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  shelf: "currently-reading" | "read" | "to-read";
  rating?: number;
  comment?: string;
  url: string;
  sourceUrl: string;
}

export interface LibrarySnapshot {
  profileUrl: string;
  verifiedAt: string;
  books: LibraryBook[];
}

import config from "@/content/data/goodreads-config.json";
export const goodreadsProfileUrl = config.profileUrl;
export const libraryShelves = config.shelves as LibraryBook["shelf"][];
