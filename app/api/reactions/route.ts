import { getAllPosts } from "@/lib/posts";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getReactionCount, incrementReaction, supabase } from "@/lib/supabase";

/**
 * Reacciones (T16, FR-005) — uno de los DOS únicos handlers no estáticos.
 *
 * GET  ?slug=x → { count: n }   (0 sin fila; null sin Supabase configurado)
 * POST { slug } → { count: n }  (validación de slug real → rate limit → RPC)
 *
 * Contratos de degradación: sin env vars el GET responde { count: null } y el
 * POST 503 — nunca un 500 crudo, nunca un error interno (ni la key) en el
 * body. El cliente (Reactions.tsx) esconde la UI ante cualquier no-ok/null.
 */

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" } as const;

/** Máx. incrementos por IP por minuto (ventana de lib/rate-limit). */
const MAX_INCREMENTS_PER_MIN = 10;

/**
 * Anti-spam de filas (plan.md, riesgo "endpoint spameable"): solo slugs de
 * posts reales tocan la base. getAllPosts lee de fs — el trace del bundle
 * incluye content/posts (next.config.ts, outputFileTracingIncludes).
 */
function isRealSlug(slug: string): boolean {
  try {
    return getAllPosts().some((post) => post.slug === slug);
  } catch {
    return false;
  }
}

export async function GET(request: Request): Promise<Response> {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) {
    return Response.json(
      { error: "slug requerido" },
      { status: 400, headers: NO_STORE },
    );
  }
  if (!isRealSlug(slug)) {
    return Response.json(
      { error: "slug desconocido" },
      { status: 404, headers: NO_STORE },
    );
  }
  if (!supabase.configured) {
    return Response.json({ count: null }, { headers: NO_STORE });
  }

  try {
    const count = await getReactionCount(slug);
    return Response.json({ count }, { headers: NO_STORE });
  } catch (error) {
    console.error("[reactions] GET falló:", error);
    return Response.json(
      { error: "no disponible" },
      { status: 503, headers: NO_STORE },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  let slug: unknown;
  try {
    ({ slug } = (await request.json()) as { slug?: unknown });
  } catch {
    return Response.json(
      { error: "body inválido" },
      { status: 400, headers: NO_STORE },
    );
  }
  if (typeof slug !== "string" || !isRealSlug(slug)) {
    return Response.json(
      { error: "slug desconocido" },
      { status: 404, headers: NO_STORE },
    );
  }
  if (!supabase.configured) {
    return Response.json(
      { error: "no configurado" },
      { status: 503, headers: NO_STORE },
    );
  }
  if (!rateLimit(`reactions:${clientIp(request)}`, MAX_INCREMENTS_PER_MIN)) {
    return Response.json(
      { error: "demasiadas reacciones, esperá un minuto" },
      { status: 429, headers: NO_STORE },
    );
  }

  try {
    const count = await incrementReaction(slug);
    return Response.json({ count }, { headers: NO_STORE });
  } catch (error) {
    console.error("[reactions] POST falló:", error);
    return Response.json(
      { error: "no disponible" },
      { status: 503, headers: NO_STORE },
    );
  }
}
