# Implementación

1. Negociación pura comprobable, middleware con headers internos sobrescritos y validación de rutas; diccionarios tipados y contexto React SSR.
2. Traducciones de MDX versionadas; localización de chrome, páginas y componentes interactivos sin cambiar reproductores ni snapshots Goodreads.
3. SEO, búsqueda y feeds por idioma; selector accesible preserva ruta/query/hash.
4. Typecheck, lint, regresiones existentes, casos negociación y pruebas HTTP/navegador en móvil y escritorio; revisión independiente antes del commit.

## Decisión de arquitectura

Prefijos externos con rewrites a las rutas existentes: minimiza movimiento de archivos y mantiene el admin fuera del cambio. Un header interno sobrescrito por middleware determina el idioma durante SSR; nunca se confía en uno recibido del cliente. `headers()` hace dinámico el render de páginas: coste de caché documentado y aceptado para mantener un único árbol y `<html lang>` correcto. Los snapshots siguen locales y el servidor no traduce ni llama APIs para traducciones. Los feeds estáticos tienen rutas separadas `/feeds/es` y `/feeds/en`; `/rss.xml` conserva el feed español.

Guía oficial consultada: https://nextjs.org/docs/15/app/api-reference/file-conventions/middleware y https://nextjs.org/docs/15/app/api-reference/functions/headers.
