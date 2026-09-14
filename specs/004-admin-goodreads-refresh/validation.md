# Verificación — Goodreads desde /admin/now

Base: `6582b2a` (incluye snapshot La caída y corrección del contrato NowListening).

## Checks automatizados

- `npm run test:embeds`: 50/50 antes del ajuste de recuperación ante rate limit.
- `node --test tests/admin-goodreads.test.mjs tests/goodreads-sync.test.mjs`: 19/19
  después de agregar la regresión de reintento (51 tests en la suite completa).
- `npx tsc --noEmit`: PASS.
- `npm run lint`: PASS; se corrigió el nombre reservado `module` de un helper de test.
- `npm run build`: PASS, 19 páginas generadas y `/admin/now` dinámica.

Los tests verifican autenticación antes de acceso externo, captura temprana del SHA,
separación de estantes, lectura vacía, RSS incorrecto/otro perfil/HTTP error, timeout,
respuesta sin Content-Length mayor al límite, fin de paginación repetido y exceso de
páginas, tapas opcionales, conflictos y permisos GitHub, guardado atómico, doble envío,
rate limit y publicación recuperable sin nueva escritura. Dependencias remotas simuladas.

## Navegador local

Servidor local en `127.0.0.1:3107`, con contraseña/token sintéticos y login real por
formulario. El preload `/tmp/blog-goodreads-browser-mock.mjs` intercepta GitHub,
Goodreads y un hook `.invalid`: la escritura del snapshot sólo existe en memoria.
No se leyó ningún secreto ni se hizo ningún commit/deploy remoto durante los tests.

- Sin sesión, `/admin/now` redirige a `/admin/login`.
- Login y navegación al panel pasan. Goodreads aparece sólo en `/admin/now`.
- Revisor Astra independiente: flujo exitoso a 390px, sin overflow ni errores JS;
  muestra «Publicación solicitada» y lectura de fixture, sin botón de reintento tras éxito.
- Implementador: screenshot a 1280px, sin error overlay ni errores JS.
- Durante el envío se observó `aria-busy=true` y el botón desactivado.
- Hook simulado 503: la UI muestra lecturas guardadas y «Reintentar publicación».
- Tercer pedido dentro de un minuto: se muestra el límite y se conserva el botón de
  reintento (regresión encontrada y corregida en review).
- Pasada la ventana, reintento exitoso: el log mantuvo 8 consultas RSS y 2 escrituras
  de snapshot; sólo aumentó el hook de 2 a 3 llamadas. La UI vuelve a «Publicación
  solicitada» y oculta reintento.

Evidencia local: `/tmp/blog-goodreads-admin-desktop.png`,
`/tmp/blog-goodreads-admin-hook-failed.png`,
`/tmp/blog-goodreads-admin-review-390.png` y
`/tmp/blog-goodreads-browser-calls.jsonl` (métodos/destinos; sin credenciales).

## Límites explícitos

El hook confirma que pidió un deploy, no que la compilación terminó. Los frenos de
frecuencia/concurrencia son por instancia; la protección de escritura entre instancias
es el SHA. Una respuesta perdida del navegador requiere volver al panel y solicitar
publicación del contenido guardado. Goodreads no se consulta en visitas/builds.

El único archivo de contenido adicional es el cache oficial iTunes de «Andar Conmigo»
generado por la verificación, para que siguientes builds reutilicen la metadata actual.
No se modificaron música manual, `lib/now.ts`, datos de Goodreads ni el serializer.
