# Plan técnico

1. Preservar el checkout existente: trabajar en rama feat/interactive-gabinete desde origin/main en worktree separado. Leer instrucciones, README y DESIGN completos; inspeccionar arquitectura con graft; comprobar sitio publicado desktop/mobile.
2. Verificar Goodreads RSS público y guardar snapshot local de 7 libros con URLs de procedencia, estado derivado del estante, valoraciones personales y comentarios opcionales. Separar parser puro y carga de servidor; actualizar explícitamente con timeout, tamaño acotado y escritura atómica. Nunca interpretar descripción RSS como HTML confiable.
3. Añadir escena three cargada progresivamente dentro de /gabinete, con selección compartida con botones HTML y ficha. Render inicial semántico en servidor; canvas decorativo respecto de lectores de pantalla. Tokenizar materiales; dibujar bajo demanda, cancelar movimientos con reduced motion y liberar recursos al desmontar.
4. Ampliar resolución musical cacheada de Ahora con coincidencia verificable título/artista y URLs oficiales HTTPS. Un componente cliente controla audio preview y vinilo; el enlace oficial queda disponible sin JS o sin audio. Sin OAuth ni SDK nuevos.
5. Añadir bloque del canal real, con video solo si es verificable y reutilizando YouTube/LazyEmbed. Preservar curaduría MDX existente.
6. Centralizar UI, documentar mantenimiento y ejecutar verificación estática, visual, funcional y fallos de servicios. Revisión independiente y correcciones antes de commit/push/PR; no merge.

## Decisiones de compatibilidad

- Mantener Next.js 15, React 19, Tailwind 4 y three ya instalados. No agregar frameworks de 3D, autenticación de Spotify ni servicios nuevos.
- Goodreads devuelve user_shelves vacío para varios leídos: usar el estante solicitado como estado; user_rating 0 equivale a dato ausente, nunca una valoración cero.
- La selección automática puede priorizar leyendo actualmente (si hay datos), leídos recientes y pendientes, sin llamar favoritos a la categoría read.
