# Blog bilingüe

El visitante debe recibir español o inglés según sus idiomas preferidos del navegador, que normalmente siguen al sistema. El contenido propio actual se publica en ambos idiomas; títulos y datos de terceros conservan su versión original.

- FR-1: URLs públicas explícitas `/es` y `/en`. Los enlaces anteriores negocian cookie manual válida, luego Accept-Language con regiones y pesos; español es el fallback.
- FR-2: La ruta explícita tiene prioridad. La elección manual persiste, con opción de volver al idioma del sistema. No hay redirecciones por cambio de cookie al abrir una URL explícita.
- FR-3: HTML SSR, metadatos, navegación, búsqueda, fechas, accesibilidad, lecturas y música coherentes en cada idioma. Los lectores sin JavaScript reciben el idioma correcto.
- FR-4: Traducciones versionadas separadas de los originales del admin. Fallback explícito al idioma original para futuros artículos sin traducción; nunca inventar contenido. El hash de la fuente invalida traducciones desactualizadas; sólo el original vigente controla publicación, slug, borrador y fechas.
- FR-5: Reacciones comparten slug. Admin, API, assets y feed histórico conservan sus contratos.
- FR-6: Canonicals, alternates, sitemap, feeds e imágenes sociales apuntan a versiones localizadas. No indexar URLs negociadas duplicadas.
