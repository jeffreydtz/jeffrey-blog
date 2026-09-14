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
    title: "Andar Conmigo",
    artist: "Julieta Venegas",
    spotifyTrackUrl: "https://open.spotify.com/track/5LymLsCJpJGn2st1P48GQm",
    coverUrl:
      "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/41/ec/dd/41ecddff-a8e2-6ce2-5c4a-60ee909e65ea/mzi.ajqhjytq.jpg/300x300bb.jpg",
  },
  reading: {
    title: "El lobo estepario",
    author: "Hermann Hesse",
    coverUrl: "https://covers.openlibrary.org/b/id/12527375-M.jpg",
  },
};
