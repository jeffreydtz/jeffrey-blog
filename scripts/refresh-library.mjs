// Node >=20.18; no additional package or API key.
import fs from "node:fs/promises";
import config from "../content/data/goodreads-config.json" with { type: "json" };
import { buildGoodreadsSnapshot } from "../lib/goodreads-sync.mjs";

const snapshot = await buildGoodreadsSnapshot(config);
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
