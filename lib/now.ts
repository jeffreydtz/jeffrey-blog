/**
 * Widget "Ahora" — qué estoy escuchando y leyendo en este momento.
 *
 * Flujo editorial: se edita desde /admin (o a mano); cada guardado es un
 * commit y el próximo deploy lo refleja en el footer. Sin scrobbling.
 *
 * Las portadas se resuelven solas en build time (lib/now-covers.ts: iTunes
 * para el disco, OpenLibrary para el libro) y quedan cacheadas en
 * `.cache/embeds/`. `coverUrl` es un override manual OPCIONAL: si está,
 * gana sobre la búsqueda automática; si la búsqueda no encuentra nada,
 * el widget queda solo-texto, como siempre.
 */

import type { Now } from "@/lib/now-types";
export type { Now, NowListening, NowReading } from "@/lib/now-types";

export const now: Now = {
  listening: {
    title: "The Gambler",
    artist: "Kenny Rogers",
    spotifyTrackUrl: "https://open.spotify.com/track/5KqldkCunQ2rWxruMEtGh0",
    coverUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/04/74/a2/0474a210-0239-df57-1457-96339adf1e56/13UABIM74030.rgb.jpg/300x300bb.jpg",
  },
  reading: {
    title: "La campana de cristal",
    author: "Sylvia Plath",
    coverUrl: "https://covers.openlibrary.org/b/id/8564661-M.jpg",
  },
};
