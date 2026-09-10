# Biblioteca — refinamiento editorial

Reemplazar los volúmenes estrechos por encuadernaciones de proporciones reales: tapas,
lomos rotulados, bloque de páginas y líneas de encuadernación. El libro elegido gira
hacia el lector y sale suavemente del estante, sin animación permanente. Reorganizar
el HTML en un índice numerado compacto y una ficha de lectura única, con datos del
snapshot existente. Sin JavaScript quedan todas las fichas; sin WebGL sigue funcionando
el índice. Respetar tokens, tema, foco, touch y reduced motion. Verificar en 390/768/1440,
ambos temas, teclado y fallbacks; ejecutar TypeScript, lint y build antes de publicar.

## Verificación

Chromium local en 1440, 768 y 390 px, claro/oscuro: sin overflow de documento.
Selección de los siete libros por Enter/Space, foco visible, mouse sobre geometría,
touch y sincronización del índice horizontal: PASS. Ficha actualizada con el título
correcto. Texto 200%, reduced motion, lista completa sin JS, índice sin WebGL y pérdida
explícita del contexto: PASS. Cero errores JavaScript de aplicación.
Revisión independiente de código: APPROVE, incluida sincronización de scrollLeft.
Datos Goodreads, contenido MDX, música y lockfile intactos.

Build de producción, TypeScript, lint y `git diff --check`: salida 0.
`/gabinete` sigue estático: 6,88 kB de ruta, 130 kB First Load JS.
