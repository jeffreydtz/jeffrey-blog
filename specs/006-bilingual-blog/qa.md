# Verificación

## Automatizada

- `npm run build`: PASS en la build final de producción.
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS.
- `npm run test:embeds`: 68/68 PASS, incluidos siete casos i18n que ejecutan el middleware, el endpoint de preferencia, los loaders y RSS reales mediante el harness TypeScript existente.
- Negociación: variantes regionales, pesos, orden, idioma no soportado, cookie válida/inválida; URL explícita gana, redirect privado/no-store, headers internos sobrescritos y exclusiones admin/API/assets.
- Preferencia: ES/EN persistentes, Auto elimina cookie, query/hash de home y artículo conservados, redirects externos/privados rechazados.
- Contenido: edición invalida traducción, borrador/eliminación no publican huérfanos, rename no recupera traducción vieja, idioma no contamina otro, fecha publicada proviene del original.
- Feeds: identidad histórica `/rss.xml`, identidad por canal estable en feeds nuevos incluso con fallback.
- `git diff --check`: PASS.
- Prettier de todos los archivos modificados: PASS.

## Navegador y HTTP

Primera build de producción local, puerto 3106:

- HTML SSR inglés, metadata canonical/hreflang/RSS/OG inglés antes de ejecutar JavaScript; equivalentes españoles correctos.
- Fotografías revisadas: `/tmp/blog-i18n-en-desktop.png`, `/tmp/blog-i18n-en-vinyl-320.png`; sin overflow en 320 px.
- Revisión independiente: 390 px inglés, 1440 px español oscuro, sin overflow ni errores de hidratación. Evidencia `/tmp/i18n-review-en390.png`, `/tmp/i18n-review-es1440-dark.png`.
- Revisión independiente: elegir ES con header EN persiste; Auto vuelve a EN; búsqueda inglesa con cookie ES abre `/en/posts/...`.
- Revisión independiente: audio real de Phil Collins reproduce; se conservan las dos canciones y La caída. Goodreads conserva snapshots y títulos originales.
- HTTP independiente: páginas 404 localizadas, auth anónima admin, API y assets mantienen comportamiento; OG devuelve PNG distinto según idioma.

## Artefacto final

Tras los fixes de RSS y anclas se reconstruyó producción y se reinició el servidor local. `21` comprobaciones HTTP/artefacto pasan: las 14 páginas localizadas entregan idioma SSR y canonical correctos; los tres feeds entregan GUID y self-link esperados; el redirect legacy conserva query y privacidad; sitemap contiene 14 URLs; búsqueda inglesa contiene la traducción; el trace de la función incluye el MDX traducido. Browser final de `/en/colofon` carga sin errores y mantiene IDs `tipografia`, `materiales`, `filosofia`.

Revisiones independientes: ambos agentes Astra emitieron **APPROVE**, incluidos código de routing/seguridad, traducciones, ciclo editorial, metadatos y concordancia del cuerpo del PR con la evidencia.

## Límites

No se ejercitaron mutaciones autenticadas contra GitHub/Goodreads en producción ni se publicó un deployment durante esta tarea. Las traducciones futuras se actualizan editorialmente; el admin publica el original y las traducciones desactualizadas vuelven al original con aviso. Los textos de terceros no se traducen. Leer el idioma en SSR hace dinámicas las páginas públicas.
