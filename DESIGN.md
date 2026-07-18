---
# DESIGN.md — Jeffrey's blog
# Sistema de diseño propio: "old money minimalista" — papel, tinta, espacio.
# Fuente única de verdad visual. Los componentes referencian tokens, NUNCA valores literales.
# Los tokens viven como CSS custom properties en app/globals.css (@theme de Tailwind v4);
# este frontmatter es el contrato que globals.css implementa.

colors:
  light: # tema por defecto (:root) — "papel de día"
    paper: "#F5F1E8" # fondo crema. Nunca blanco puro.
    paper-raised: "#EFEADD" # superficie apenas elevada (cards, code inline bg)
    ink: "#1A1815" # tinta principal. Nunca negro puro (#000 prohibido).
    ink-secondary: "#4A453C" # metadata, subtítulos
    ink-muted: "#7A7264" # fechas, labels, texto terciario
    accent: "#5C1F1F" # burdeos. MÁXIMO UN elemento por vista.
    accent-hover: "#732727" # único estado derivado permitido del acento
    hairline: "#D9D2C3" # divisores 1px, bordes de contenedores
    selection: "#E4DCC9" # fondo de ::selection
  dark: # "pergamino nocturno" (.dark) — paleta DISEÑADA, no inversión
    paper: "#2E2720" # umbral profundo: marrón cálido oscuro (aclarado 2026-07; ink 11.4:1)
    paper-raised: "#362E25" # superficie elevada: un paso más clara, nunca sombra
    ink: "#E8E2D4" # hueso. Nunca blanco puro.
    ink-secondary: "#B5AC99" # metadata
    ink-muted: "#847B69" # terciario
    accent: "#A66A5E" # burdeos aclarado/desaturado para fondo oscuro (el #5C1F1F no contrasta)
    accent-hover: "#BC7F72"
    hairline: "#463E33" # separación por borde, jamás por sombra (sigue al papel aclarado)
    selection: "#3A342B"

typography:
  display:
    family: "Fraunces" # variable, next/font/google, ejes opsz/SOFT/WONK
    css-var: "--font-display"
    usage: "títulos, título del sitio, drop caps, números de página"
  body:
    family: "Source Serif 4" # variable, next/font/google
    css-var: "--font-body"
    usage: "cuerpo de texto, UI, metadata"
  mono:
    family: "ui-monospace / SF Mono / Cascadia Mono / Menlo / Consolas" # stack de sistema, sin webfont extra
    css-var: "--font-mono"
    usage: "código inline y bloques (Shiki); el código es ciudadano raro acá"
  scale: # rem; line-height junto al tamaño, nunca suelto
    display-xl: {
        size: "3.5rem",
        weight: 500,
        line-height: 1.05,
        tracking: "-0.02em",
      } # título de post
    display-lg: {
        size: "2.5rem",
        weight: 500,
        line-height: 1.1,
        tracking: "-0.015em",
      } # h1 de página
    display-md: {
        size: "1.75rem",
        weight: 500,
        line-height: 1.2,
        tracking: "-0.01em",
      } # h2
    display-sm: {
        size: "1.25rem",
        weight: 500,
        line-height: 1.3,
        tracking: "0",
      } # h3, títulos de listado
    body: { size: "1.125rem", weight: 400, line-height: 1.75, tracking: "0" } # prosa
    body-sm: { size: "0.9375rem", weight: 400, line-height: 1.6, tracking: "0" } # excerpts, footer
    label: {
        size: "0.75rem",
        weight: 500,
        line-height: 1.2,
        tracking: "0.18em",
        transform: uppercase,
      } # labels mayúscula tracking amplio
    micro: {
        size: "0.6875rem",
        weight: 400,
        line-height: 1.2,
        tracking: "0.14em",
        transform: uppercase,
      } # números de página, folios

measure:
  prose: "70ch" # cuerpo de post: 65–75ch, fijado en 70ch
  ui-max: "72rem" # ancho máximo del chrome (header/footer/home)

spacing: # escala base 8px expresada en rem (tokens --spacing-* en globals.css)
  2xs: "0.25rem"
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "2rem"
  xl: "3rem"
  2xl: "5rem"
  3xl: "8rem"

radius:
  none: "0" # default: esquinas rectas
  subtle: "4px" # máximo absoluto (contenedores de embeds, imágenes)

borders:
  hairline: "1px solid var(--color-hairline)" # ÚNICO divisor permitido

motion:
  ease-page: "cubic-bezier(0.16, 1, 0.3, 1)" # curva de la casa (pergamino, reveals)
  duration-fast: "150ms" # hovers, underlines
  duration-slow: "600ms" # reveals de entrada
  duration-reveal: "1000ms" # unroll del pergamino (ScrollReveal) — orgánico, no snappy
  roll-shadow: "color-mix(ink 14% claro / 9% oscuro, transparent)" # scrim del rollo; ÚNICA sombra del sitio
  reduced-motion: "todo se vuelve instantáneo o fade mínimo; obligatorio"
---

# Jeffrey's blog — sistema de diseño "old money minimalista"

Papel, tinta y espacio en blanco, ejecutados con sensibilidad moderna. La referencia
mental es un libro bien impreso y una biblioteca privada: sobrio, tipográfico, sin
ruido. El lujo está en lo que falta.

## Principios

1. **El texto es la interfaz.** Casi todo se resuelve con tipografía, medida y espacio.
   Si un problema visual se puede resolver con jerarquía tipográfica, no se agrega cromo.
2. **Un solo acento.** El burdeos (`accent`) aparece **como máximo una vez por vista**:
   un link activo, un contador, una inicial. Nunca en cuerpo de texto, nunca decorativo,
   nunca dos elementos burdeos compitiendo en pantalla.
3. **Separación por línea, no por sombra.** Divisores `hairline` de 1px. Las sombras
   genéricas (`box-shadow` difusas de card) están prohibidas. La única sombra admitida
   en todo el sitio será la del efecto pergamino (fase 3), que sugiere el cilindro del
   rollo — y esa se especifica en su propio componente.
4. **Esquinas rectas.** Radius 0 por defecto; `4px` es el máximo absoluto y se reserva
   para contenedores de media (embeds, imágenes). Nada de píldoras ni cards redondeadas.
5. **Papel real.** El crema `paper` nunca es blanco puro; la tinta nunca es negro puro.
   El modo oscuro es un **pergamino nocturno diseñado** — negro cálido + hueso — no una
   inversión automática ni un gris azulado de dashboard.

## Tipografía

- **Fraunces** (variable) para display: títulos, título del sitio, drop caps, folios.
  Ejes `opsz`, `SOFT`, `WONK` cargados; peso animable. Interacción de la casa:
  **hover en links de nav/títulos anima `font-variation-settings`/weight 400→500**
  con transición suave (y sin animación bajo `prefers-reduced-motion`).
- **Source Serif 4** (variable) para cuerpo y UI. Nada de sans "por si acaso": el sitio
  es serif de punta a punta.
- **Labels**: mayúsculas + tracking amplio (`0.18em`), tamaño chico, peso 500 —
  ("PUBLICADO", "ESCUCHANDO", "ARCHIVO"). Es la voz secundaria del sitio.
- **Drop caps**: primera letra de post en Fraunces, ~3 líneas de alto, vía
  `.drop-cap::first-letter`. Solo en cuerpo de post, nunca en excerpts.
- **Números de página tipo libro**: folios en `micro`, centrados o al margen, con
  Fraunces si son numerales destacados.
- Numerales tabulares (`font-variant-numeric: tabular-nums`) en fechas alineadas
  y cualquier columna numérica.
- **Código**: mono de sistema (`mono`), sin webfont extra. Los colores de
  sintaxis (Shiki, dual theme) se definen en `lib/shiki.ts` — ESA es su fuente
  de tokens (un tema TextMate no puede leer CSS custom properties): tinta
  cálida derivada de la familia ink/accent, sin neón. El fondo del bloque sí
  es token (`paper-raised` + borde `hairline` + radius `subtle`).

## Layout

- **Medida de prosa: 70ch** (rango permitido 65–75ch). Sagrada.
- **Grid asimétrico**: el contenido no vive centrado-simétrico como un template;
  márgenes desiguales intencionales en pantallas anchas (p. ej. columna de prosa
  desplazada del centro, metadata colgando en el margen izquierdo). La asimetría es
  compositiva, no aleatoria: un solo eje fuera de centro por vista.
- Escala de espaciado 8px (`spacing.*`). El aire entre bloques es generoso:
  secciones separadas por `2xl`/`3xl`, no por cajas.
- Chrome (header/footer) a `ui-max`, contenido de lectura a `prose`.

## Interacción

- **Links**: subrayado que **se dibuja de izquierda a derecha** al hover
  (`background-size` o `::after` con `scaleX`, transición `duration-fast` +
  `ease-page`). Sin cursors custom, sin imágenes de cursor.
- **Foco visible**: `outline` de 1px `ink` desplazado 2px — nunca se elimina el foco.
- Estados: default / hover / focus como mínimo en todo elemento interactivo.
  Hover jamás cambia layout (los cambios de peso variable no reflowean: Fraunces
  variable mantiene métricas).
- `prefers-reduced-motion: reduce` apaga TODA animación no esencial. Sin excepciones.

## Modo oscuro

- Estrategia de clase: `.dark` en `<html>`, script inline anti-FOUC
  (localStorage `theme` → fallback `prefers-color-scheme`).
- Misma jerarquía, mismas reglas; solo cambian los valores de los tokens.
  Si un componente necesita "un color más para dark mode", el token está mal diseñado.
- El acento en dark es `#A66A5E` (burdeos aclarado): el `#5C1F1F` de luz no llega a
  contraste AA sobre `#1C1814` y está prohibido usarlo ahí.

## Anti-cliché (prohibiciones duras)

- **Sin texturas de papel** de fondo (ni sutiles, ni SVG noise, ni grain).
- **Sin fuentes caligráficas, blackletter ni "medievales".** Old money ≠ pergamino literal.
- **Sin look "Squarespace editorial"**: nada de hero full-bleed con serif gigante
  centrada + foto lavada, nada de espaciado uniforme de template.
- **Sin gradientes** (de marca SaaS o de cualquier tipo), sin glassmorphism, sin blur.
- **Sin sombras genéricas** de card/elevación.
- **Sin bounce exagerado** ni springs juguetones; la curva de la casa es `ease-page`.
- **Sin emojis en el chrome** del sitio; iconografía mínima, trazo 1px, solo si es
  imprescindible (p. ej. ThemeToggle).
- **Sin sonido sintético**; foley real o silencio (fase 3).

## Regla token-only

Todo valor visual en componentes debe resolverse desde un token
(`var(--color-paper)`, `var(--font-display)`, clases Tailwind generadas por `@theme`,
utilidades de la casa `.label`, `.hairline`, `.drop-cap`, `.link-underline`).
**Un hex, un px de borde o una curva de easing escritos a mano en un componente son
un defecto** y se corrigen agregando el token que faltaba, no dejando el literal.
