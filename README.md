# jeffrey-blog

Blog personal con estética old-money: papel, tinta y espacio. Next.js 15 (App Router) + MDX. Todo el contenido vive en git — escribir es crear un archivo `.mdx` y pushear; no hay panel de administración, ni CMS, ni base de datos para los posts. Lo único con backend es un extra opcional (las reacciones) que desaparece solo si no está configurado.

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
- `<YouTube>` y `<Vimeo>` son facades: no cargan nada hasta que se hace click en play.
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
npm install
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
│   ├── acerca/  colofon/       # páginas fijas
│   ├── lab/                    # playground (solo dev)
│   ├── api/reactions/          # contador de reacciones (Supabase)
│   └── rss.xml/  sitemap.ts  robots.ts
├── content/posts/              # ← los posts (.mdx); acá se escribe
├── components/
│   ├── mdx/                    # YouTube, Spotify, Tweet, LinkCard, …
│   ├── ui/                     # header, footer, Cmd+K, reacciones
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

## Widget "Ahora"

Qué estoy escuchando y leyendo, en el footer. Se actualiza a mano: editar los valores de `lib/now.ts`, commitear y pushear. Sin scrobbling — es parte del encanto. Las portadas sí se resuelven solas en build (iTunes para el disco, OpenLibrary para el libro, vía `lib/now-covers.ts`) y se cachean en `.cache/embeds/`; si la búsqueda no encuentra nada, el widget queda solo-texto. `coverUrl` en `lib/now.ts` permite fijar una portada a mano.

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
