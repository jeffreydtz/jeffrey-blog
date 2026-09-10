# QA independiente: datos públicos y preview

## Alcance

Revisión de lib/goodreads-rss.mjs, lib/goodreads.ts, lib/library-data.ts, lib/itunes-track.ts, lib/now-track.ts, scripts/refresh-library.mjs y snapshot. Pruebas con node:test y TypeScript ya instalado; ningún paquete, login, secreto ni cambio de infraestructura añadido.

## Pruebas

tests/embeds.test.mjs cubre 15 escenarios: RSS vacío legítimo; rating personal frente a promedio; rating cero y comentario ausente; XML truncado/HTML de login; perfil/estante equivocado; título ausente/rating inválido; URLs externas; DTD/entidades/tamaño excesivo; item sin cerrar; ID de libro discordante; selección deduplicada con máximo siete; artista/tema/demo incorrecto; match exacto; metadatos/hosts inválidos; fallback de preview/portada conservando enlace oficial.

Ejecución inicial: `node tests/embeds.test.mjs`: 13 PASS, 2 FAIL. `node --test tests/embeds.test.mjs` salió 1 y agrupó el fallo del archivo sin detalle; la invocación directa imprimió los 15 escenarios y las dos aserciones fallidas.

Verificación adicional contra los tres RSS descargados independientemente: parsear, seleccionar y comparar mediante `assert.deepEqual` con content/data/goodreads.json dio PASS. Los siete objetos coinciden exactamente en todos sus campos; no solo en título o cantidad.

## Hallazgos iniciales comunicados para corregir

1. RSS con `<item>` sin `</item>` se aceptaba como estante vacío: la actualización podía sustituir información válida por un vacío aparente. Debe fallar y usar fallback.
2. URL de libro se validaba con prefijo: ID 12 aceptaba /book/show/1234.Other. Debe coincidir el identificador numérico completo, aceptando solamente los sufijos reales de Goodreads.

## Seguridad y mantenimiento observados

- Solo endpoints públicos fijos de Goodreads/iTunes; sin credenciales, OAuth o SDK nuevos.
- El parser rechaza DTD y entidades externas, no ejecuta HTML y extrae campos textuales. La UI debe seguir renderizando esos strings como texto React.
- El selector musical exige coincidencia exacta de título/artista y hosts HTTPS oficiales; preview/portada inválidos degradan a null, enlace de tema inválido descarta candidato.
- El snapshot contiene siete libros coincidentes con los RSS públicos observados: cinco leídos y dos pendientes, sin valoración inventada para pendientes. Actualmente leyendo está legítimamente vacío.
- El actualizador manual descarga y valida todos los estantes antes de escribir un temporal y renombrar; un error previo preserva el snapshot anterior.
- El límite de 2 MB se comprueba después de leer el cuerpo; protege procesamiento, no constituye límite de transferencia. Las peticiones están acotadas por timeout y dirigidas a un servicio fijo.

Audio real, fin/pausa, WebGL, selección, teclado, responsive, JS deshabilitado y video lazy quedan fuera de estas pruebas unitarias; necesitan la verificación visual/funcional del flujo principal.
