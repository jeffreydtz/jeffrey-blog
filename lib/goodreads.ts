import "server-only";
import snapshot from "@/content/data/goodreads.json";
import { goodreadsProfileUrl, type LibrarySnapshot } from "@/lib/library-data";

/** Only the reviewed local snapshot is served. Refresh explicitly with npm run refresh:library. */
export function getLibrary(): LibrarySnapshot {
  if (snapshot.profileUrl !== goodreadsProfileUrl)
    return { profileUrl: goodreadsProfileUrl, verifiedAt: "", books: [] };
  return snapshot as LibrarySnapshot;
}
