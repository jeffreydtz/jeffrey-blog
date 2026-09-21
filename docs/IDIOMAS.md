# Español e inglés

Las páginas públicas tienen URL `/es` o `/en`. Los enlaces anteriores siguen funcionando: primero se respeta la preferencia guardada por el selector, luego `Accept-Language` del navegador (incluye regiones y pesos); si no hay un idioma compatible se usa español. Una URL con prefijo siempre conserva su idioma. **Auto** borra la preferencia manual y vuelve a usar la del navegador. Las elecciones funcionan con links normales sin JavaScript. Query strings y fragmentos se conservan; las traducciones de páginas mantienen los IDs originales de sus secciones.

El navegador suele seguir el idioma del sistema, pero puede tener una configuración propia: la web recibe las preferencias del navegador y no consulta directamente el sistema operativo.

## Contenido editorial

El admin sigue editando los originales de `content/posts` y `content/pages`. Las traducciones están en `content/translations/<idioma>/{posts,pages}/<slug>.mdx` con `lang`, `title`, `excerpt` (posts), `slug` y `source_hash`: SHA256 del archivo original completo, incluidos los metadatos. Para obtenerlo después de revisar la traducción, ejecutar `sha256sum content/posts/<slug>.mdx` (o `content/pages`). Copiar ese valor a `source_hash` de la traducción.

Una edición desde el admin cambia el hash: desde la próxima publicación la versión inglesa muestra el original actualizado, identifica el idioma del cuerpo y avisa que todavía falta la traducción actualizada. Renovar la traducción y su hash después de revisarla. No hay traducción automática al guardar ni servicio externo nuevo. Esta regla también se aplica a Acerca, Colofón y Gabinete.

El original controla publicación, fecha, temas, portada y slug. Pasarlo a borrador, borrarlo o cambiarle el slug impide publicar su traducción anterior. No basta con crear un archivo de traducción para publicar un post. Las reacciones conservan el slug compartido. Los títulos, descripciones y comentarios de Goodreads y los nombres de canciones mantienen el texto original.

## Búsqueda, feeds y SEO

`prebuild` genera `search-index.es.json` y `search-index.en.json`, excluye borradores y usa el mismo control de vigencia que el renderer. El sitemap y hreflang incluyen sólo traducciones vigentes. Si falta una, el canonical apunta al original.

Los feeds nuevos son `/feeds/es` y `/feeds/en`. `/rss.xml` mantiene los GUID y el self-link históricos para no duplicar entradas de suscriptores existentes. Los GUID de los feeds nuevos se mantienen por idioma del canal incluso cuando un post vuelve temporalmente al original.

## Render y límites

El middleware reescribe los prefijos públicos sobre las rutas existentes y sobrescribe headers internos antes de SSR. La raíz lee esos headers para `<html lang>`, lo que hace dinámicas las páginas públicas: se intercambia caché de página completa por un árbol compartido sin mover el admin. Los snapshots Goodreads siguen importados localmente; no se consultan feeds al visitar una página. Los redirects de negociación son privados y no cacheables. Admin, API, recursos y feeds no negocian idioma. El panel editorial sigue en español.
