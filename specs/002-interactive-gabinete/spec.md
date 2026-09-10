# Gabinete interactivo

## Objetivo

Ampliar el gabinete editorial y el widget Ahora conservando papel, tinta, serif, asimetría, líneas finas y los tokens de DESIGN.md. El usuario autoriza implementación autónoma, validación, commits con su identidad, push y PR contra main; no merge ni deploy manual a producción.

## Requisitos

- FR-001: biblioteca de aproximadamente 5–8 libros públicos verificables de https://www.goodreads.com/user/show/128723960-jeffrey. No inventar libros, estado, valoraciones, comentarios ni URLs. Snapshot local mantenible con procedencia.
- FR-002: snapshot local actualizado explícitamente mediante RSS público. No consultar Goodreads durante builds o visitas; sin claves API ni login.
- FR-003: libros con geometría, profundidad, luz y perspectiva reales mediante la dependencia three existente; selección por mouse, teclado y touch, estado seleccionado sobrio, ficha y lista HTML semántica equivalente accesibles sin WebGL y sin JavaScript.
- FR-004: tema claro/oscuro desde variables CSS; reduced motion sin animaciones continuas; liberar geometrías, materiales, texturas, listeners, timers y contexto WebGL.
- FR-005: la canción sigue definida en lib/now.ts. Resolver portada, enlace y preview autorizado con iTunes cuando exista; cache reproducible en .cache/embeds/. Sin autoplay; reproducir, pausar, reanudar y gestionar finalización/error; aria-pressed y nombre accesible sincronizados con audio real. Vinilo gira únicamente reproduciendo y sin reduced motion.
- FR-007: integrar el canal real https://www.youtube.com/@shefrii, video específico si lo proporciona el usuario o más reciente públicamente verificable. Reutilizar fachada lazy click-to-load y youtube-nocookie.com; enlace visible al canal. Si no puede verificarse video, presentar enlace sin inventar embed.
- FR-008: solo dos o tres microinteracciones discretas; sin partículas, sonidos automáticos, cursores personalizados, parallax agresivo, gradientes, sombras genéricas ni cards redondeadas.
- FR-009: textos de UI reutilizables en lib/ui.ts; foco visible, contraste, controles táctiles, semántica e iframes etiquetados. Validar 390/768/1440 px, texto al 200%, ambos temas, reduced motion, teclado y sin overflow.
- FR-010: README con mantenimiento de datos/URLs, preview y fallos externos; no secretos ni variables innecesarias; conservar contenido personal ajeno al cambio.

## Criterios de entrega

Instalación con lockfile, TypeScript, lint, build, git diff --check, revisión visual y funcional local y revisión independiente. Informar bloqueos externos separadamente de defectos; ninguna integración se declara comprobada sin evidencia. Entregar URL de PR, cambios, archivos principales, validaciones exactas, limitaciones e instrucciones del preview Vercel.
