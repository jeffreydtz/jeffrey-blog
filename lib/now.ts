/**
 * Widget "Ahora" — qué estoy escuchando y leyendo en este momento.
 *
 * Flujo editorial: esto se actualiza A MANO. Editá los valores, commiteá y
 * pusheá; el próximo deploy lo refleja en el footer. Sin APIs de scrobbling:
 * si cambió lo que escucho, cambio el archivo. Es parte del encanto.
 *
 * Las portadas se resuelven solas en build time (lib/now-covers.ts: iTunes
 * para el disco, OpenLibrary para el libro) y quedan cacheadas en
 * `.cache/embeds/`. `coverUrl` es un override manual OPCIONAL: si está,
 * gana sobre la búsqueda automática; si la búsqueda no encuentra nada,
 * el widget queda solo-texto, como siempre.
 */

interface NowListening {
  title: string;
  artist: string;
  /** Override manual de portada; sin él se busca en iTunes en build time. */
  coverUrl?: string;
}

interface NowReading {
  title: string;
  author: string;
  /** Override manual de portada; sin él se busca en OpenLibrary en build time. */
  coverUrl?: string;
}

export interface Now {
  listening: NowListening;
  reading: NowReading;
}

export const now: Now = {
  listening: {
    title: "Paradise",
    artist: "Sade",
  },
  reading: {
    title: "1984",
    author: "George Orwell",
  },
};
