import type { Now } from "@/lib/now-types";
import { parseListeningTrack } from "@/lib/listening-history";

/** Generate data only: provider types cannot drift when an admin saves a song. */
export function serializeNow(now: Now): string {
  const data: Now = {
    listening: parseListeningTrack(now.listening),
    reading: now.reading,
  };
  return `/** Actualizado desde /admin/now. El historial vive en content/data/listening-history.json. */
import type { Now } from "@/lib/now-types";
export type { Now, NowListening, NowReading } from "@/lib/now-types";

export const now: Now = ${JSON.stringify(data, null, 2)};
`;
}
