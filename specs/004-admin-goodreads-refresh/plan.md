# Actualizar Goodreads desde la web

Pedido autorizado: actualizar las lecturas desde el navegador sin comandos locales.

- Agregar «Actualizar Goodreads» a `/admin/now`, separado del formulario editorial.
- Autenticar dentro de la acción antes de consultar Goodreads, GitHub o el deploy hook.
- Compartir entre CLI y web la descarga y validación de ambos estantes, con límites de
  tamaño, páginas y tiempo. Guardar un único snapshot sólo cuando todos sean válidos.
- Leer el snapshot de GitHub antes de consultar RSS y escribir con su SHA para rechazar
  actualizaciones concurrentes. No escribir disco desde la web ni modificar `lib/now.ts`.
- Solicitar publicación con el hook existente. Distinguir guardado/publicación solicitada
  de un sitio ya actualizado; permitir reintentar sólo publicación desde la web.
- Feedback accesible y botón bloqueado mientras trabaja; límite por instancia (sin
  prometer exclusión distribuida). Preservar Goodreads vacío como un estado válido.
- Verificar auth, fuentes inválidas, conflictos, límites y recuperación con mocks,
  typecheck/lint/build y navegador local sin llamadas de escritura a producción.
- Review independiente Astra antes de commit/push; root coordina publicación.

Fuentes: Next.js Server Actions y GitHub Contents API (SHA obligatorio al reemplazar).
No se agregan servicios, dependencias, secretos ni tareas programadas.
