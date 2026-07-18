import type { PostLang } from "@/types/post";

/**
 * TODOS los strings de UI del sitio viven acá (spec: decisión "bilingüe").
 * Los posts declaran su propio idioma; el chrome del sitio es español por defecto.
 * Ningún componente hardcodea texto de interfaz.
 */
export const ui = {
  siteTitle: "Jeffrey's blog",
  siteDescription:
    "Ensayos personales sobre atención, oficio y tecnología. Papel, tinta y espacio en blanco.",
  nav: {
    home: "Inicio",
    archive: "Archivo",
    about: "Acerca de",
    colophon: "Colofón",
  },
  post: {
    published: "Publicado",
    updated: "Actualizado",
    readingTime: "min de lectura",
    related: "Relacionados",
    previous: "Anterior",
    next: "Siguiente",
    pagination: "Otros ensayos",
    draft: "Borrador",
    tags: "Temas",
  },
  home: {
    latest: "Últimos ensayos",
  },
  search: {
    label: "Buscar",
    shortcutHint: "⌘K",
    placeholder: "Buscar ensayos, temas…",
    empty: "Nada por acá todavía.",
    sectionPosts: "Ensayos",
    sectionPages: "Páginas",
    sectionTags: "Temas",
  },
  now: {
    listening: "Escuchando",
    reading: "Leyendo",
  },
  newsletter: {
    label: "Correo ocasional",
    placeholder: "tu@correo.com",
    submit: "Suscribirse",
    sending: "Enviando…",
    success: "Listo. Gracias por leer.",
    error: "No se pudo suscribir. Probá de nuevo.",
    invalid: "Ese correo no parece válido.",
    already: "Ese correo ya estaba suscripto.",
    unavailable: "Las suscripciones no están disponibles todavía.",
  },
  reactions: {
    label: "¿Te quedó algo?",
    thanks: "Gracias.",
    mark: "Dejar una marca",
  },
  theme: {
    toggle: "Cambiar tema",
    light: "Claro",
    dark: "Oscuro",
  },
  sound: {
    toggle: "Sonido de página",
    on: "Sonido activado",
    off: "Sonido desactivado",
  },
  lab: {
    title: "Laboratorio",
    subtitle: "Prototipo del pergamino — solo desarrollo",
    replay: "Repetir animación",
    embedsTitle: "Componentes MDX",
    embedsSubtitle: "Embeds, tipografía y código — solo desarrollo",
  },
  mdx: {
    play: "Reproducir",
    youtubeTitle: "Video de YouTube",
    vimeoTitle: "Video de Vimeo",
    spotifyTitle: "Reproductor de Spotify",
    soundcloudTitle: "Reproductor de SoundCloud",
    bandcampTitle: "Reproductor de Bandcamp",
    tweetFallback: "Ver en X",
    tweetView: "Ver en X",
    anchor: "Enlace a esta sección",
  },
  footer: {
    rights: "Algunos derechos reservados",
  },
} as const;

const LOCALE_BY_LANG: Record<PostLang, string> = {
  es: "es-AR",
  en: "en-US",
};

/** Formatea una fecha ISO (YYYY-MM-DD) en el idioma del post. Ej: "14 de septiembre de 2025". */
export function formatDate(iso: string, lang: PostLang = "es"): string {
  return new Intl.DateTimeFormat(LOCALE_BY_LANG[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}
