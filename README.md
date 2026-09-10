# jeffrey-blog

**Sitio en vivo:** <https://jeffrey-blog-tau.vercel.app>

Blog personal con estética old-money: papel, tinta y espacio. Next.js 15 (App Router) + MDX. Todo el contenido vive en git — escribir es crear un archivo `.mdx` y pushear (o guardarlo desde `/admin`, que commitea al mismo repo). No es un CMS ni hay base de datos para los posts. Lo único con backend es un extra opcional (las reacciones) que desaparece solo si no está configurado.

## Cómo agregar un post nuevo

1. Crear un archivo en `content/posts/` con el slug como nombre: `content/posts/mi-slug.mdx`.
2. Escribir el frontmatter (ver campos abajo) y el cuerpo en MDX.
3. `git add`, `git commit`, `git push` a `main`. Push = publicar: Vercel rebuildea y el post queda en el sitio.

Para verlo antes de publicar: `npm run dev` y abrir `http://localhost:3000/posts/mi-slug`.

### Frontmatter

Ejemplo completo (los campos se validan en build — un campo obligatorio faltante rompe el build con un error que dice qué archivo y qué campo):

```yaml
---
title: "El lujo de lo lento"
slug: "el-lujo-de-lo-lento"
excerpt: "Una defensa de la lentitud como forma de atención."
cover_image: "/images/lujo-lento.jpg"
published_at: "2025-09-14"
updated_at: "2025-10-02"
tags: ["ensayo", "atención"]
lang: "es"
draft: false
---
```

| Campo          | Obligatorio | Tipo             | Notas                                                                                       |
| -------------- | ----------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `title`        | sí          | string           | Título del post.                                                                            |
| `slug`         | sí          | string           | Debe coincidir con el nombre del archivo (`mi-slug.mdx` → `slug: "mi-slug"`). Es la URL.    |
| `excerpt`      | sí          | string           | Resumen corto; se usa en listados, RSS, búsqueda y metadata OG.                             |
| `cover_image`  | no          | string           | Ruta bajo `public/` (ej. `/images/foo.jpg`).                                                |
| `published_at` | sí          | fecha ISO        | `YYYY-MM-DD`. Ordena los listados y el archivo.                                             |
| `updated_at`   | no          | fecha ISO        | `YYYY-MM-DD`. Solo si hubo una revisión que valga la pena señalar.                          |
| `tags`         | sí          | string[]         | Alimentan el archivo por tag y los posts relacionados.                                      |
| `lang`         | sí          | `"es"` \| `"en"` | Idioma del post.                                                                            |
| `draft`        | no          | boolean          | `true` → visible solo en `npm run dev`; excluido de listados, RSS, sitemap y build de prod. |

El contrato completo está en `types/post.ts`; la validación en `lib/posts.ts`.

### Componentes MDX disponibles

Se usan directo en el cuerpo del post, sin imports. Ejemplos reales:

```mdx
<YouTube id="ZXsQAXx_ao0" />
<YouTube
  id="oK2y5xH20ZY"
  caption="Pie de foto editorial opcional bajo el video"
/>

<Vimeo id="76979871" />

<Spotify id="0Hs3BomCdwIWRhgT57x22T" kind="album" />
<Spotify url="https://open.spotify.com/track/…" />

<SoundCloud url="https://soundcloud.com/forss/flickermood" />

<Bandcamp album="2721182898" />
<Bandcamp track="1963341082" />

<Tweet id="20" />

<LinkCard url="https://en.wikipedia.org/wiki/IndieWeb" />
```

Notas:

- `<Spotify>` acepta `kind`: `track` | `album` | `playlist` | `episode` | `show` | `artist` (o directamente `url`, que lo deduce). `compact` da un player más bajo.
- `<Bandcamp>` usa los ids numéricos del EmbeddedPlayer de Bandcamp (`album`, `track`, o ambos para un track dentro de un álbum).
- `<YouTube>` y `<Vimeo>` son facades: no cargan nada hasta que se hace click en play. Ambos aceptan `caption` (pie editorial en estilo label bajo el marco).
- `<Tweet>` y `<LinkCard>` no incrustan iframes: resuelven el contenido en build y pintan una cita/tarjeta estática con la tipografía del sitio. Si la red falla y no hay cache, degradan a un link estilado.
- Props inválidas (id malformado, URL que no es de SoundCloud, etc.) rompen el build con un mensaje que muestra el uso correcto.

### Qué pasa en el build

Al buildear (o pushear), automáticamente:

- Se calcula el tiempo de lectura de cada post (~200 palabras/min).
- Se computan los posts relacionados por tags compartidos.
- Se regeneran RSS (`/rss.xml`), sitemap, imágenes OG por post y el índice de búsqueda (`public/search-index.json`, generado por `scripts/build-search-index.mjs` en `prebuild`/`predev`).
- Los datos de `<Tweet>` y `<LinkCard>` se cachean en `.cache/embeds/` — **ese directorio se commitea**: así el build en Vercel no depende de que Twitter/el sitio linkeado respondan.

Los drafts (`draft: true`) solo se ven corriendo en dev; nunca llegan a producción.

## Correr local

```bash
npm ci              # instala las versiones del lockfile existente
npm run dev          # http://localhost:3000
```

Nota: el índice de la búsqueda (Cmd+K) se genera en `predev`/`prebuild`. Un post agregado o retitulado con `next dev` corriendo aparece en la home y el archivo al instante, pero en la paleta recién al reiniciar `npm run dev`.

Build de producción local:

```bash
npm run build
npm start
```

La ruta `/lab` es un playground solo-dev (pergamino + smoke de todos los componentes MDX); en el build de producción es un 404 estático.

## Estructura

```
jeffrey-blog/
├── app/                        # rutas (App Router)
│   ├── posts/[slug]/           # página de post + imagen OG por post
│   ├── archivo/                # archivo por año/tag
│   ├── gabinete/               # curaduría: qué miro (vlogs YT) y qué leo
│   ├── vinyl/                  # tocadiscos (Three.js, lazy)
│   ├── acerca/  colofon/       # páginas fijas
│   ├── lab/                    # playground (solo dev)
│   ├── api/reactions/          # contador de reacciones (Supabase)
│   └── rss.xml/  sitemap.ts  robots.ts
├── content/posts/              # ← los posts (.mdx); acá se escribe
├── components/
│   ├── mdx/                    # YouTube, Spotify, Tweet, LinkCard, …
│   ├── ui/                     # header, footer, Cmd+K, reacciones
│   ├── reading/                # carrusel CSS 3D del estante Leído
│   ├── three/                  # tocadiscos, marcas de impresor
│   └── scroll/                 # reveals y sonido de página
├── lib/                        # posts, mdx, now.ts, supabase, oembed, …
├── types/                      # contrato de frontmatter e índice de búsqueda
├── scripts/                    # build-search-index.mjs
├── .cache/embeds/              # cache commiteado de Tweet/LinkCard
├── public/sounds/              # asset de sonido (ver su README)
├── supabase/migration.sql      # referencia SOLO lectura (ya aplicada)
├── specs/001-blog-foundation/  # spec, plan y tareas de la fundación
└── DESIGN.md                   # sistema de diseño (tokens y guardrails)
```

## Gabinete

`/gabinete` conserva la página de curaduría: lo que estoy **mirando** (vlogs de YouTube embebidos con `<YouTube caption="…">`) y lo que estoy **leyendo** (`<LinkCard>` + notas). Se edita como cualquier página fija: `content/pages/gabinete.mdx`, commit y push. Entra algo cuando vale la pena, sale cuando deja de valerla — sin algoritmo.

## Panel /admin

`/admin` es el panel de administración: publicaciones (crear/editar/borrar), Gabinete, Acerca, Colofón y el widget "Ahora", todo desde el navegador. **No es un CMS**: cada guardado es un commit real a `main` vía la GitHub API — el repo sigue siendo la única fuente de verdad y el historial queda en git.

Env vars (sin las dos primeras el panel queda deshabilitado y no aparece nada):

- `ADMIN_PASSWORD` — contraseña de acceso (sesión de 7 días, cookie firmada; cambiar la contraseña revoca sesiones).
- `GITHUB_TOKEN` — token fine-grained con permiso **Contents: Read and write** solo sobre este repo. Un token de solo lectura (o el `GITHUB_TOKEN` de Actions sin `contents: write`) da 403 *Resource not accessible by personal access token* al guardar.
- `VERCEL_DEPLOY_HOOK_URL` — (opcional) Deploy Hook de Vercel; con él cada guardado dispara el rebuild solo. Sin él, el commit queda hecho y hay que deployar a mano.

El panel está fuera de robots/sitemap/búsqueda; el login tiene rate limit por IP.

## Widget "Ahora"

Qué estoy escuchando y leyendo, en el footer. Desde `/admin/now` se busca una canción (iTunes Search) o un libro (OpenLibrary) y se rellenan título, artista/autor y portada (artwork 300×300 / cover `-M`). Los campos siguen editables a mano; Guardar y publicar commitea `lib/now.ts`. Sin scrobbling ni Spotify OAuth — es parte del encanto. Si la URL de portada queda vacía, el build la busca solo (`lib/now-covers.ts`) y la cachea en `.cache/embeds/`; si no hay resultado, el widget queda solo-texto. El mismo `listening` es el disco que arranca en el plato de `/vinyl`.

## Vinilo

`/vinyl` es un tocadiscos aparte — no vive en la home, para no cargar WebGL en el LCP. Un disco y un plinto procedurales (Three.js, sin React Three Fiber). El giro se pausa fuera de pantalla, con la pestaña oculta y con `prefers-reduced-motion`. El estante de `/gabinete` es CSS 3D, no este canvas.

**Cómo editar el cajón**

1. Abrir `content/data/vinyl.json`.
2. Cada álbum necesita `id` (slug único; `now` está reservado), `title` y `artist`.
3. Opcional: `spotifyUrl` (`https://open.spotify.com/album/…`), `coverUrl` (https, gana sobre iTunes) y `note` (una línea editorial).
4. Guardar, `git commit` y pushear. En el próximo build, iTunes resuelve portada y enlace de Apple Music (coincidencia exacta de título/artista; cache en `.cache/embeds/` con clave `itunes-album:v1:ARTISTA — TÍTULO`). Commitear el JSON nuevo del cache si querés builds reproducibles sin red.

El tema de **Ahora** (`lib/now.ts`) se antepone siempre como primer disco. Si el cajón ya tiene el mismo título y artista, no se duplica.

Hay un TODO en `components/three/TurntableScene.ts` para, más adelante, cambiar plinto y brazo por un GLB de Astra/Blender sin tocar la página.

## Sonido de página

La infraestructura está lista pero el asset no se shipea (no hay foley CC0 digno y el sitio jamás usa sonido sintético). Para activarlo: conseguir un foley real de vuelta de página que cumpla la spec de `public/sounds/README.md` y soltarlo como `public/sounds/page-turn.mp3`. Con el archivo presente, el toggle de sonido aparece solo en el header; sin archivo no se renderiza nada. El sonido está apagado por defecto — el visitante opta.

## Reacciones

Un contador anónimo por post. Los datos viven en la tabla `blog_reactions` del **proyecto Supabase de bot-salesforce** (ref `cullwwdkcgnwgqjmfmqn`) — decisión deliberada para no crear un proyecto nuevo. Jamás apuntar esto al proyecto de zarix.

- `supabase/migration.sql` es una copia de referencia de **solo lectura**: ya fue aplicada el 2026-07-17. **No volver a ejecutarla.**
- Env vars: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (del proyecto `cullwwdkcgnwgqjmfmqn`: dashboard de Supabase → Settings → API). La key es solo de servidor; nunca lleva prefijo `NEXT_PUBLIC_`.
- Sin esas variables, la API responde 503 y el bloque de reacciones desaparece solo del post — no hay error visible.

## Deploy (Vercel)

1. Repo en GitHub → **Import** en Vercel. Auto-deploy en cada push a `main`.
2. Cargar las env vars (mismos nombres que `.env.example`):
   - `NEXT_PUBLIC_SITE_URL` — URL canónica del sitio (para metadata, RSS, sitemap y OG).
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — reacciones (opcional).
3. Nota: el autor de los commits debe resolver a un login de GitHub (`jeffreydtz`), o Vercel bloquea el deploy.

## Modo impresión

Cmd+P (o Ctrl+P) sobre un post imprime una versión tipográfica limpia — sin chrome de navegación.

## Diseño

Papel, tinta y espacio: el sitio intenta parecerse más a un libro bien encuadernado que a una app. Tokens y guardrails en `DESIGN.md`; los créditos y decisiones, en `/colofon`.

## Accesibilidad y notas

- Dark mode automático (con toggle).
- `prefers-reduced-motion` respetado: sin reveals ni animaciones para quien lo pida.
- Cmd+K abre la paleta de comandos con búsqueda de posts.

## Biblioteca interactiva y Goodreads

El estante de `/gabinete` es el paquete **ReadingShelf** (CSS 3D + scroll-snap nativo):
carrusel horizontal de tapas reales, ficha con nota / promedio Goodreads / año, y un
filmstrip de miniaturas para recorrer los ~60 libros leídos. Sin WebGL ni GLB. El
header y el footer del sitio siguen envueltos alrededor; el estante va a sangre.
Teclado (← → Home End), arrastre y snap; `prefers-reduced-motion` deja la pose 3D
fija. Si una tapa falta o falla, hay una placa tipográfica — nunca un ladrillo vacío.

La fuente es el **RSS público del propio perfil de Goodreads**, sin login ni API key.
La configuración vive en `content/data/goodreads-config.json`: `profileUrl` y
`shelfUrl` (estante Leído). Solo se consulta `read`: no entra `to-read` ni
`currently-reading`. El snapshot revisable está en `content/data/goodreads.json`.
Cada libro guarda tapa (`book_large_image_url`, o Open Library si falta),
`user_rating`, `average_rating`, año, comentario y URL. Cero en `user_rating`
significa sin valoración. Un estante vacío no recibe libros inventados.

**Snapshot local:** ni el build ni las visitas consultan Goodreads. La página siempre sirve
los datos revisados y versionados. Para renovarlos explícitamente (Node 20.18+ o 22+):

```bash
npm run refresh:library
npm run test:embeds
git diff -- content/data/goodreads.json
```

El comando consulta el feed `read` (paginado), valida y recién entonces reemplaza el archivo.
Si hay timeout, una página de login o XML inesperado, sale con error y conserva el respaldo.
Revisar el diff, commitear y publicar por PR. Al cambiar de perfil ejecutar este comando;
si falla, no se muestran los libros del perfil anterior.

## Canal de YouTube

`lib/cabinet-channel.ts` contiene el canal real y el video verificado. Se eligió el más reciente
del [feed público de Shefrii](https://www.youtube.com/feeds/videos.xml?channel_id=UCA3jf05nGvtY5lPZTML-MDA),
verificado también con oEmbed. Para fijar otro video, cambiar `video.id`, `title`, `publishedAt`
y `sourceUrl` por datos públicos comprobados; para cambiar de canal, actualizar también `url`.
Si no hay videos públicos verificables, poner `video: null`: queda el enlace al canal.
El video se mantiene editorialmente, no cambia en cada visita. Usa la fachada existente:
el iframe de `youtube-nocookie.com` se crea solo al pulsar reproducir. El enlace al canal
permanece disponible incluso si YouTube falla o JavaScript está desactivado.

## Preview musical oficial

La canción sigue definida exclusivamente por título/artista en `lib/now.ts`.
`lib/now-track.ts` busca una coincidencia exacta en la iTunes Search API y guarda portada,
URL del tema y `previewUrl` en `.cache/embeds/`, usando la clave
`itunes-track:v1:ARTISTA — TÍTULO`. Ese JSON se commitea: con caché no se consulta la API
en cada build. Para renovar una URL caducada, eliminar solo el JSON con esa clave legible,
levantar el sitio o compilar con red y revisar el nuevo resultado antes de commitearlo.
Al cambiar de canción, la clave cambia automáticamente; una búsqueda sin coincidencia
exacta degrada a portada/texto. `coverUrl` sigue permitiendo la portada manual.

El botón del vinilo reproduce únicamente el fragmento suministrado por Apple, a pedido,
con pausa y reanudación. No aloja ni descarga canciones completas, no inicia sesión en
Spotify y no necesita instalar nada para el visitante. La animación gira solo durante
la reproducción y se detiene con reduced motion. El enlace visible abre el tema oficial.
Si no hay preview o el navegador/servicio rechaza el audio, queda ese enlace o portada/texto;
el resto del blog sigue funcionando. La disponibilidad y duración dependen de Apple.

## Validar esta integración

```bash
npm ci
npm run test:embeds
npx tsc --noEmit
npm run lint
npm run build
git diff --check
npm start -- --port 3100
```

Abrir `/gabinete` en 390, 768 y 1440 px, temas claro/oscuro, zoom de texto 200% y reduced motion.
Recorrer el carrusel (snap, flechas, filmstrip, teclado), comprobar tapas reales y la ficha.
En el footer, pulsar el vinilo, pausar, reanudar y esperar el final; abrir también el enlace
del tema. El video no debe crear un iframe hasta el click. Revisar consola y desbordes horizontales.
Las pruebas de datos usan fixtures únicamente de test; no agregan libros al snapshot.

Para probar en Vercel, abrir **Details / Visit Preview** del check de la PR si la integración
GitHub está conectada. Si no aparece un check, conectar el repositorio al proyecto Vercel o
crear un deployment **Preview** de esta rama desde el panel; no promoverlo a producción.

El icono de pestaña vive en `app/icon.svg` (J vectorial, papel/tinta y tema del
sistema); `app/favicon.ico` incluye el respaldo de 16, 32 y 48 px. Next.js publica
ambos mediante su convención de archivos. Los resultados y límites de esta entrega
están en `specs/002-interactive-gabinete/validation.md`.
