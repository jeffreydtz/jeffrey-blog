import "server-only";
import snapshot from "@/content/data/goodreads.json";
import { goodreadsProfileUrl, type LibrarySnapshot } from "@/lib/library-data";

/** Only the versioned snapshot is served. Refresh explicitly from /admin/now or the CLI. */
export function getLibrary(): LibrarySnapshot {
  if (snapshot.profileUrl !== goodreadsProfileUrl)
    return { profileUrl: goodreadsProfileUrl, verifiedAt: "", books: [] };
  return snapshot as LibrarySnapshot;
}
