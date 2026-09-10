# Validación — 10 de septiembre de 2026

## Entorno y alcance

Node 22.22.1, npm 9.2.0, Chromium headless 151 mediante agent-browser y Playwright.
Trabajo aislado desde origin/main en feat/interactive-gabinete. El checkout original
con cambios locales de seguridad no fue modificado. Ningún MDX personal, lib/now.ts,
configuración de credenciales ni migración cambió.

## Resultados

- `npm ci`: exit 0, 491 paquetes instalados, lockfile sin cambios.
- `npm run refresh:library`: exit 0, siete libros verificados mediante los tres RSS públicos.
- `npm run test:embeds`: 15 PASS, 0 FAIL (incluye RSS vacío/malformado, fuentes e IDs,
  rating personal frente a promedio, selección sin duplicados y coincidencia iTunes).
- `npx tsc --noEmit`: exit 0.
- `npm run lint`: exit 0, sin warnings.
- `npm run build`: exit 0, 22 páginas generadas; `/gabinete` estático, 6,55 kB de ruta,
  129 kB First Load JS. La primera ejecución se solapó por error con dev y falló al
  leer un artefacto de .next; ejecución final aislada sin ese conflicto: PASS.
- `git diff --check`: exit 0.
- Revisión independiente: APPROVE tras corregir prioridad de portada manual y retirar
  consultas de Goodreads durante visitas/builds.
- Sitio publicado inspeccionado en desktop y mobile antes de los cambios visuales.
- Local: 390/768/1440 px, claro/oscuro: ancho de documento igual al viewport en los seis casos.
- Texto al 200% a 390 px: ancho de documento 390 px; corregidos desbordes de navegación,
  palabras largas y dominios de enlaces. La tipografía puede partir palabras en espacio extremo.
- Teclado: selección por Enter y Space, navegación por Tab y foco solid de 1 px.
- Mouse y touch: selección real mediante raycasting del canvas y mediante botones HTML.
- Botones de libros: al menos 44 px de alto; control de vinilo 64 × 64 px.
- Contraste de ink-muted: claro 4,80:1, oscuro 5,09:1; sobre papel elevado 4,51:1 y
  4,61:1. Ink-secondary: 8,44:1 claro, 6,53:1 oscuro. Materiales 3D derivan del tema.
- Reduced motion: selección instantánea y animation-name del vinilo `none`, incluso
  mientras audio sigue reproduciendo; sin bucle de animación en reposo.
- Audio real de Apple: 30,003991 segundos, sin autoplay; play, pausa, reanudación,
  final natural, aria-pressed y animación sincronizados. Error de red inducido:
  mensaje accesible y enlace oficial conservados.
- Sin JS: siete entradas HTML, siete enlaces de título, sin canvas; enlace al canal
  y al tema disponibles. Sin WebGL: lista de siete libros y fallback visibles.
- Pérdida explícita del contexto WebGL: canvas retirado, lista intacta.
- YouTube: cero iframes antes del click; después se crea un iframe titulado en
  youtube-nocookie.com para el video verificado. El servicio responde con desafío
  antibot; reproducción del video NO verificada en este entorno.
- Navegación hacia home correcta. Favicon SVG y ICO: HTTP 200 y enlaces en head.
- Consola: cero errores JavaScript de aplicación; prueba móvil/home también registró
  cero errores de consola. Fallos deliberados de audio y telemetría externa de
  YouTube al cerrar el iframe se distinguen de errores del blog.

## Fuentes comprobadas

- Goodreads: los RSS currently-reading, read y to-read del usuario 128723960. El
  primer estante está vacío; snapshot contiene cinco leídos y dos pendientes.
- iTunes Search: trackId 1148642447, título/artista, enlace y preview del cache
  coinciden exactamente con la respuesta pública. No se guardó ningún audio.
- YouTube: feed del canal UCA3jf05nGvtY5lPZTML-MDA y oEmbed confirman video
  0xqXGjghVpw, título y author_url https://www.youtube.com/@shefrii.

## Límites

La instalación informa siete avisos de auditoría del lockfile original (seis high,
uno critical). No se agregaron dependencias ni se modificó el lockfile. La
actualización de dependencias y los cambios locales de seguridad pertenecen a un
trabajo separado; estos avisos no son errores de compilación de esta integración.
No se ejecutó lector de pantalla físico ni Safari/iOS real: se verificó semántica,
nombres accesibles y navegación en Chromium, con touch emulado.
No se desplegó a producción ni se hizo merge. La disponibilidad futura de Apple,
Goodreads y YouTube sigue dependiendo de cada servicio.

## Comprobación de la versión compilada y entrega

`npm start -- --port 3100`: la versión de producción renderiza siete libros, canvas,
cero iframes antes del click y ningún overlay. Touch, texto al 200%, navegación a
home y ambos favicon repitieron PASS, sin errores de consola. PR abierta contra
main: https://github.com/jeffreydtz/jeffrey-blog/pull/1. Vercel inició automáticamente
un deployment Preview; no se ejecutó ningún deploy manual a producción.
