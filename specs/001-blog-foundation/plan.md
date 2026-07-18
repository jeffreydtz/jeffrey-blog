# Plan 001 — jeffrey-blog

## Stack final

- **Next.js 15** (App Router, satisface "14+"; portfolio ya corre 16 sin fricción, 15 = sweet spot de compat con next-mdx-remote RSC), TypeScript estricto
- **Tailwind CSS v4** (tokens vía `@theme` en CSS — equivalente moderno del tailwind.config; los tokens viven en `app/globals.css` + documentados en `DESIGN.md`)
- **next-mdx-remote** v5 (`/rsc`) + gray-matter; **Shiki** para code highlight server-side
- **Framer Motion** solo donde CSS no alcanza (pergamino reveal, palette); el resto CSS transitions
- **Fuse.js** client-side sobre `public/search-index.json` generado en build (script prebuild)
- **Supabase** (proyecto zarix, tabla aislada `blog_reactions`) para contadores — ver Flag A
- **Buttondown** vía route handler + `BUTTONDOWN_API_KEY`
- Fonts: `next/font/google` — Fraunces variable + Source Serif 4 variable

## Arquitectura de carpetas

```
jeffrey-blog/
├── app/
│   ├── layout.tsx / globals.css        (tokens @theme, fonts, dark mode)
│   ├── page.tsx                        (home)
│   ├── posts/[slug]/page.tsx           (SSG + generateStaticParams)
│   ├── archivo/page.tsx
│   ├── acerca/page.tsx · colofon/page.tsx
│   ├── rss.xml/route.ts · sitemap.ts · opengraph-image por post
│   └── api/reactions/route.ts · api/subscribe/route.ts   (únicos no-estáticos)
├── components/
│   ├── mdx/        (YouTube, Vimeo, Spotify, SoundCloud, Bandcamp, Tweet, LinkCard, Blockquote, Code, Img)
│   ├── scroll/     (ScrollReveal pergamino, PageSound, SoundToggle)
│   └── ui/         (CommandPalette, Search, ThemeToggle, NowWidget, Reactions, NewsletterForm, PrevNext, RelatedPosts, DropCap)
├── content/posts/*.mdx · content/pages/{acerca,colofon}.mdx
├── lib/  (posts.ts, mdx.ts, reading-time.ts, search-index.ts, oembed.ts, og-scrape.ts, now.ts, ui.ts, supabase.ts)
├── scripts/build-search-index.ts (+ linkcard/tweet cache en build)
├── types/post.ts
├── public/sounds/README.md  (dónde soltar page-turn foley CC0)
├── DESIGN.md · README.md · .env.example
└── specs/001-blog-foundation/
```

## Decisiones de arquitectura

1. **Pergamino como reveal de entrada, no route transition real**: App Router no tiene view transitions estables cross-route con clip-path custom; se implementa como animación de mount del contenido del post (client component wrapper con clip-path inset + Framer Motion), disparada al montar `/posts/[slug]`. Idéntico efecto percibido, cero hacks de router. Parallax de primeros 150px con `useScroll` de Framer Motion. `useReducedMotion` lo apaga.
2. **Build-time fetch (Tweet oEmbed, LinkCard OG) con cache commiteado** (`.cache/embeds/*.json` versionado): builds de Vercel reproducibles y rápidos, sin depender de que Twitter responda en cada deploy. Miss de cache en build → fallback estático elegante (cita/link plano), build nunca rompe.
3. **Reacciones**: tabla `blog_reactions (slug text pk, count int)` + RPC `increment_reaction(slug)` security definer. Route handler usa `SUPABASE_SERVICE_ROLE_KEY` (server-only), valida slug contra lista de posts real (anti-spam de filas), rate limit best-effort por IP en memoria + dedupe localStorage en cliente. RLS: deny all a anon/authenticated — solo service role. GET counts públicos vía el mismo handler.
4. **Dark mode**: clase `dark` en `<html>`, script inline anti-FOUC, localStorage + `prefers-color-scheme` fallback. Paleta nocturna diseñada (no invertida) en DESIGN.md.
5. **Sonido**: `SoundToggle` visible en el chrome del post; si `public/sounds/page-turn.mp3` no existe (estado inicial), el toggle no se renderiza y no hay 404s. README documenta specs del asset (≤300ms, foley real, CC0 — sugerencias de fuente). No se shipea sonido sintético.
6. **Repo propio** `jeffreydtz/jeffrey-blog` público + entrada en `/root/projects/.gitignore` del harness. Git author in-repo: `jeffreydtz <64873738+jeffreydtz@users.noreply.github.com>` (requisito Vercel auto-deploy — lección beproplayer).

## Flags no bloqueantes (decidir en GATE 1)

- **Flag A — RESUELTO (usuario, 2026-07-17)**: tabla `blog_reactions` en el proyecto Supabase de **bot-salesforce** (`cullwwdkcgnwgqjmfmqn`, reactivado ese día). **zarix jamás se toca.** Documentado en docs/PROJECTS.md (entrada bot-salesforce) y en bot-salesforce/supabase/schema.sql. Env del blog: `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` apuntan a ese proyecto.
- **Flag B — sonido**: infra lista, asset no se shipea (no hay foley CC0 local digno). Usuario suelta archivo cuando quiera.

## Riesgos

| Riesgo                                  | Mitigación                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| next-mdx-remote v5 + Next 15 edge cases | pin de versiones probadas; MDX simple (sin plugins exóticos)                                        |
| Twitter oEmbed sin auth puede fallar    | cache commiteado + fallback estático                                                                |
| Route handlers rompen "todo estático"   | solo 2, aislados, documentados; resto `export const dynamic = 'force-static'`                       |
| Endpoint reacciones spameable           | validación slug real + rate limit + security-reviewer obligatorio (escalación forzada: API pública) |

## Fases → ver tasks.md

Review final: `code-reviewer` + `security-reviewer` (endpoints públicos reacciones/newsletter) antes de GATE 2. Directiva vigente 2026-07-02: findings confirmados se arreglan y se pushea sin preguntar; deploy a Vercel (producción) SÍ espera aprobación humana.
