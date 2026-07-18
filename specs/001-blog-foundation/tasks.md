# Tasks 001 — jeffrey-blog

`[P]` = paralelizable con la tarea anterior. Orden respeta "orden de trabajo" del brief.

## Fase 1 — Setup + contenido

- [x] T01 Scaffold Next.js 15 + TS + Tailwind v4 + ESLint/Prettier; estructura app/components/lib/content/types/scripts; git init con author jeffreydtz
- [x] T02 DESIGN.md custom old-money (tokens paleta clara + nocturna, tipografía, reglas anti-cliché) — gate para todo UI
- [x] T03 Tipos + `lib/posts.ts` (parse gray-matter, orden, filtros, related por tags, prev/next, reading time, drafts) + `lib/mdx.ts`
- [x] T04 [P] 3 posts de ejemplo (2 ES, 1 EN, con embeds de muestra y tags cruzados p/ related) + `acerca.mdx` + `colofon.mdx` + `lib/now.ts`

## Fase 2 — Sistema de diseño

- [x] T05 Tokens en `globals.css` (@theme): paletas, Fraunces + Source Serif 4 vía next/font, escala tipográfica, dark mode con script anti-FOUC
- [x] T06 Layout base + chrome: header/footer, ThemeToggle, link hover (subrayado dibujado), labels tracking amplio, divisores 1px, prose styles (medida 70ch, drop cap CSS)

## Fase 3 — Pergamino (aislado antes de integrar)

- [x] T07 `ScrollReveal`: clip-path reveal centro→vertical, cubic-bezier(0.16,1,0.3,1), sombras de cilindro sutiles, parallax 150px, useReducedMotion — prototipar en `/lab` (ruta dev-only), iterar, luego integrar
- [x] T08 [P] `PageSound` + `SoundToggle`: off default, localStorage, autodetección de asset, no render sin archivo

## Fase 4 — Componentes MDX

- [x] T09 Embeds: YouTube, Vimeo, Spotify, SoundCloud, Bandcamp (lazy, aspect-ratio fijo, contenedor 1px border)
- [x] T10 [P] Tweet (oEmbed build-time + cache commiteado + fallback cita) y LinkCard (OG scrape build-time + cache + fallback link plano)
- [x] T11 [P] Overrides: Blockquote, Code (Shiki dual theme), Img (next/image), headings/anchors, hr

## Fase 5 — Páginas y descubrimiento

- [x] T12 Home + vista de post (drop cap, metadata, related, PrevNext con microinteracción de vuelta de página)
- [x] T13 [P] Archivo por año + acerca + colofón
- [x] T14 Search index build-time + Fuse.js + CommandPalette Cmd+K
- [x] T15 [P] RSS + sitemap + OG images por post + metadata/JSON-LD

## Fase 6 — Extras

- [x] T16 Reacciones: migración Supabase (`blog_reactions` + RPC + RLS deny-all) + route handler + componente
- [x] T17 [P] NewsletterForm + `api/subscribe` (Buttondown, degrada sin key) · NowWidget en footer
- [x] T18 Print CSS por post

## Fase 7 — Cierre

- [x] T19 README (agregar post, correr local, widget ahora, sonido, env vars, deploy) + `.env.example`
- [x] T20 Review: code-reviewer + security-reviewer (endpoints) → fix findings → GATE 2 — ambos APPROVE WITH WARNINGS (2026-07-18); 4 findings arreglados: fechas YYYY-MM-DD fail-loud, tope real del rate limiter + supuesto XFF/Vercel documentado, dedupe de ids de headings (fábrica por documento), nota README índice de búsqueda en dev. Aceptados por diseño: enumeración newsletter (409), contador como métrica de vanidad, sin CSP (nota futura).
- [ ] T21 Repo GitHub + push + registro en docs/PROJECTS.md + .gitignore harness. Vercel deploy = aprobación humana aparte
