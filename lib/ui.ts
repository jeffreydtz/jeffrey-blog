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
    label: "Principal",
    home: "Inicio",
    archive: "Archivo",
    cabinet: "Gabinete",
    about: "Acerca de",
    colophon: "Colofón",
  },
  skipToContent: "Saltar al contenido",
  pages: {
    archiveDescription: "Índice de todos los ensayos, ordenados por año.",
    aboutDescription:
      "Quién escribe estas páginas: atención, oficio y tecnología, desde Argentina.",
    colophonDescription:
      "Cómo está hecho este sitio: tipografía, materiales y las reglas de la casa.",
    cabinetDescription:
      "Curaduría a mano: lo que estoy mirando y lo que recomiendo leer.",
  },
  notFound: {
    title: "Esta página no está.",
    body: "Ese enlace no lleva a ninguna página de este sitio.",
    back: "Volver al inicio",
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
    playPreview: "Reproducir fragmento autorizado",
    pausePreview: "Pausar fragmento",
    preview: "Fragmento oficial · 30 segundos",
    previewError:
      "No se pudo reproducir el fragmento. Podés abrir la canción en su sitio oficial.",
    openTrack: "Abrir canción",
  },
  cabinet: {
    channelTitle: "Mi canal",
    channelLink: "Ver mi canal en YouTube",
  },
  library: {
    title: "Mi biblioteca",
    intro:
      "Libros que ya leí: el estante Leído de Goodreads, completo. Sin lista de deseos.",
    select: "Seleccionar libro",
    selected: "Libro seleccionado",
    instructions: "Deslizá el estante o elegí un lomo del índice.",
    collection: "Estante de lecturas",
    volumes: "volúmenes",
    index: "Índice",
    profile: "Mi perfil en Goodreads",
    bookLink: "Ver en Goodreads",
    rating: "Mi valoración",
    averageRating: "Promedio Goodreads",
    published: "Publicado",
    notRated: "Sin nota",
    about: "Acerca",
    aboutBook: "Sobre el libro",
    closeAbout: "Cerrar",
    previousBook: "Libro anterior",
    nextBook: "Libro siguiente",
    browse: "Recorrer el estante",
    choose: "Elegir un libro",
    ofCount: "de",
    outOf: "de 5",
    comment: "Mi comentario",
    verified: "Última consulta",
    fallback: "El estante también se puede recorrer en esta lista.",
    empty: "Las lecturas están disponibles en mi perfil de Goodreads.",
    shelves: {
      "currently-reading": "Leyendo actualmente",
      read: "Leído",
      "to-read": "Por leer",
    },
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

/**
 * Formatea una fecha ISO (YYYY-MM-DD).
 * El chrome del sitio es español: listados, archivo y metadata de post usan
 * el default (`es`) para que el índice no mezcle "May 30, 2026" con
 * "18 de enero de 2026". Pasá `lang` del post solo cuando la fecha acompaña
 * contenido en ese idioma (p. ej. la tarjeta OG de un ensayo en inglés).
 */
export function formatDate(iso: string, lang: PostLang = "es"): string {
  return new Intl.DateTimeFormat(LOCALE_BY_LANG[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
}
