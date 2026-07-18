/**
 * Widget "Ahora" — qué estoy escuchando y leyendo en este momento.
 *
 * Flujo editorial: esto se actualiza A MANO. Editá los valores, commiteá y
 * pusheá; el próximo deploy lo refleja en el footer. Sin APIs, sin scrobbling:
 * si cambió lo que escucho, cambio el archivo. Es parte del encanto.
 */
export const now = {
  listening: {
    title: "In a Silent Way",
    artist: "Miles Davis",
  },
  reading: {
    title: "El nadador en el mar secreto",
    author: "William Kotzwinkle",
  },
} as const;

export type Now = typeof now;
