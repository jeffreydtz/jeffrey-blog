# Verificación del cajón de canciones

Las capturas corresponden al build de producción local, sin servicios GitHub de
escritura ni credenciales nuevas. El cajón muestra las dos elecciones recuperadas
de commits editoriales: Phil Collins (07ec491) y Julieta Venegas (576a4b7).

- [320 px: Spotify compacto, controles completos](./mobile-320.png)
- [1440 px: cajón personal y tocadiscos](./desktop-1440.png)
- [Spotify bloqueado: enlace alternativo y sin iframe vacío](./spotify-fallback.png)

Pruebas automatizadas: `node --test tests/*.test.mjs` (61/61). Las nuevas pruebas
`tests/listening-history.test.mjs` y `tests/now-action.test.mjs` verifican
acumulación de guardados sucesivos, IDs/títulos duplicados, validación de URLs,
lecturas Git desde un único SHA, árbol/commit atómico, rechazo de concurrencia,
auth antes de escribir y serializer consumido por TypeScript.

Pruebas reales de navegador: 320/390/1440 sin overflow; Apple reproduce un fragmento
oficial de 30.019s a pedido; cambiar proveedor o iniciar el footer pausa el anterior.
El brazo del tocadiscos inicia/pausa la canción seleccionada. Spotify usa un iframe
nativo de 152px (302px de ancho a viewport 320), sin recortar controles; si no llega
su mensaje de disponibilidad tras 12s, se retira el iframe y queda el enlace oficial.
La señal sólo se acepta desde el origen Spotify y la ventana del iframe montado.

La disponibilidad de previews depende del proveedor y del país. Una canción sin
URL Spotify ofrece búsqueda oficial; el editor permite agregar la URL de canción
para habilitar el embed. El audio de Apple se transmite desde la URL oficial y no
se almacena en el repositorio.
