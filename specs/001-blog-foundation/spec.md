# Spec 001 — jeffrey-blog: fundación completa del blog

**Estado**: draft → GATE 1 pendiente
**Fecha**: 2026-07-17
**Fuente**: brief detallado del usuario (transcripto casi íntegro — el brief ES la spec funcional; este doc formaliza decisiones y contratos)

## WHAT

Blog personal estático de autor único, estética "old money minimalista" (papel/tinta/espacio en blanco, ejecutado moderno — no template retro). Contenido = archivos MDX versionados en git. Sin admin, sin DB para contenido. Deploy Vercel.

## Decisiones cerradas (respuestas del usuario, 2026-07-17)

| Decisión   | Valor                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre     | Sitio: **"Jeffrey's blog"** · carpeta/repo: `jeffrey-blog` (repo propio `github.com/jeffreydtz/jeffrey-blog`, excluido del harness repo vía `.gitignore`, como zarix/beproplayer/portfolio) |
| Reacciones | **Supabase** (contador real persistente)                                                                                                                                                    |
| Idioma     | **Bilingüe**: posts declaran `lang: es \| en` en frontmatter; UI strings centralizados en `lib/ui.ts`, default español                                                                      |
| Newsletter | **Buttondown preparado**: form + route handler que lee `BUTTONDOWN_API_KEY` de env; funciona apenas exista la key, degrada elegante si falta                                                |

## Requerimientos funcionales

### FR-001 Contenido

- Posts: `content/posts/*.mdx`, frontmatter: `title, slug, excerpt, cover_image?, published_at, updated_at?, tags[], lang (es|en), draft?`
- Páginas sueltas: `content/pages/acerca.mdx`, `content/pages/colofon.mdx`
- Parseo: gray-matter + next-mdx-remote (RSC), SSG total (`generateStaticParams`)
- Reading time calculado del contenido (palabras/200wpm, redondeado)
- `lib/posts.ts`: listar / ordenar por fecha / filtrar por tag y año / related por tags compartidos (score = tags en común, tie-break por fecha) / prev-next cronológico
- `draft: true` excluido de listados, feed, sitemap y build de producción

### FR-002 Rutas públicas

- `/` home: listado cronológico
- `/posts/[slug]` post individual
- `/archivo` índice por año (biblioteca: 2026, 2025…)
- `/acerca`, `/colofon`
- Búsqueda client-side: índice JSON generado en build (title/excerpt/tags), Fuse.js
- Command palette Cmd+K: posts, tags, páginas — contraste "moderno" intencional
- `/rss.xml` + `/sitemap.xml` generados en build
- OG images generadas por post (`next/og`), metadata dinámica por post

### FR-003 Interacción "pergamino" (central)

- Transición de entrada a post: reveal con clip-path/mask expandiendo verticalmente desde el centro, `cubic-bezier(0.16, 1, 0.3, 1)`
- Bordes superior/inferior del "rollo": sombra sutil sugiriendo cilindro — sin textura literal
- Parallax sutil de unrolling en primeros 100–150px de scroll
- Sonido de página: OFF por default, toggle visible, localStorage, foley real corto — si no hay asset digno, queda desactivado (infra lista, se documenta dónde soltar el archivo CC0)
- TODO respeta `prefers-reduced-motion` (animaciones → instantáneo/fade mínimo)

### FR-004 Embeds MDX

- `<YouTube id/>`, `<Vimeo id/>`, `<Spotify id/>` (track/album/playlist), `<SoundCloud url/>`, `<Bandcamp id/>`, `<Tweet id/>`, `<LinkCard url/>`
- Tweet: oEmbed en build time (publish.twitter.com, sin key) con fallback lazy-load/cita estática si la API falla
- LinkCard: scrape OpenGraph en build time con cache en disco (`.linkcard-cache/`), nunca iframe
- Contenedores: borde fino 1px, radius del sitio (≤4px), aspect-ratio fijo, lazy loading, coherentes en dark mode
- Overrides tipográficos MDX: blockquote, code (Shiki server-side, tema propio en ambos modos), img (next/image), hr, headings con anchor

### FR-005 Extras

- Widget "Ahora": `lib/now.ts` (constante editable: escuchando/leyendo), render en footer, tratamiento de metadata
- Reacciones: bloque minimal fin de post, contador real en Supabase, sin login, 1 tap por visitante (dedupe localStorage + rate limit server-side por IP), route handler Vercel con service key — nunca clave en cliente
- Newsletter: input + botón fin de post/footer → route handler → API Buttondown; estilado propio
- Print: `@media print` por post — página de libro, sin nav/embeds interactivos, drop cap y serif preservados

### FR-006 Dirección visual (contrato de diseño → DESIGN.md propio)

- Paleta claro: fondo crema `#F5F1E8`, tinta `#1A1815`, acento único burdeos `#5C1F1F` (máx 1 elemento por vista)
- Dark "pergamino nocturno": negro cálido de fondo, texto hueso, mismo acento ajustado — paleta pensada, no inversión
- Tipografía: Fraunces variable (display/títulos, animación de peso 400→500 en hover) + Source Serif 4 (cuerpo); tracking amplio en mayúsculas para labels
- Sin sombras genéricas, radius 0–4px, sin gradientes SaaS, grid asimétrico, medida 65–75ch, drop caps, divisores 1px, números de página tipo libro
- Cursor/hover de links: subrayado que se dibuja con transición (no cursor.png)
- Prohibido: texturas de papel de fondo, fuentes caligráficas/medievales, look Squarespace editorial, bounce exagerado, sonido sintético

### FR-007 Calidad

- Lighthouse >90 en todo, next/image, next/font, embeds lazy
- SEO: metadata por post, OG images, JSON-LD Article
- `[NEEDS CLARIFICATION]` restantes: ninguno bloqueante (2 flags no bloqueantes en plan.md: proyecto Supabase destino, asset de sonido)

## Criterios de éxito

1. `npm run build` genera sitio 100% estático (salvo 2 route handlers: reacciones, newsletter) con 3 posts de ejemplo bilingües
2. Agregar un post = crear un .mdx + push; aparece en home, archivo, RSS, sitemap, búsqueda, related
3. Transición pergamino visible y elegante; desaparece con prefers-reduced-motion
4. Reacciones persisten entre navegadores distintos (contador compartido real)
5. README permite a un tercero clonar, correr y publicar un post sin ayuda
