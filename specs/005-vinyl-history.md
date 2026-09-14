# Cajón de canciones

Solicitud: administrar en `/admin`; conservar cada canción agregada, presentar
todo el índice de `/vinyl` como un cajón y ofrecer previews Apple/Spotify
compactos. La canción actual sigue siendo la del footer y del plato inicial.

Implementación: historial JSON versionado junto al archivo Ahora en un commit
Git atómico. Leer ambos desde el mismo SHA; una actualización concurrente se
rechaza sin pisar historial. Deduplicar por título/artista normalizados o ID
oficial del proveedor. El cajón personal no muestra los álbumes de ejemplo del dataset anterior. Recuperar
Phil Collins únicamente del historial real del repositorio.

UI: todas las fichas comparten presentación y controles; sólo un reproductor
activo. Apple es el preview oficial en streaming a pedido, Spotify se monta a
pedido con altura nativa compacta y enlace alternativo; nunca recortar controles.
Preservar el brazo del tocadiscos y navegación accesible sin canvas.

Validación: historial/dedup/URLs y conflictos Git con fixtures; build, TypeScript,
lint; navegador a 320/390/1440, cambio de canción/proveedor, pausa y fallback.
Sin cambios de auth, DB, credenciales ni nueva ruta pública de gestión.

Fuentes: [Spotify Embeds](https://developer.spotify.com/documentation/embeds),
[Apple Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/index.html).
Spotify: iframe oficial de canción a 152px, display block sin padding/recortes.
Apple: streaming del preview oficial, sin descargar audio, con atribución/enlace.
Sólo URLs/metadatos en cache. Seeds musicales: commits editoriales 07ec491 y 576a4b7;
los álbumes legacy de `vinyl.json` no se presentan como canciones elegidas.

Cierre: 61/61 tests, TypeScript, lint y build de producción pasan. Review
independiente APPROVE; navegador real verificó 320/390/1440, gesto del brazo,
exclusividad con footer y señal ready de Spotify durante más de 14 segundos.
Capturas y procedimiento: [docs/review/vinyl](../docs/review/vinyl/README.md).
