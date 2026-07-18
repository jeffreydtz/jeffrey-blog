import "server-only";

/**
 * Acceso a Supabase para las reacciones (T16) — SOLO server (route handlers).
 *
 * Deliberadamente sin @supabase/supabase-js: una tabla + un RPC no justifican
 * la dependencia; PostgREST se habla con fetch plano. La service key vive en
 * env y jamás sale de este módulo (ni en errores ni en respuestas).
 *
 * Proyecto destino: el de bot-salesforce (ref cullwwdkcgnwgqjmfmqn) — decisión
 * de usuario 2026-07-17, ver supabase/migration.sql. zarix jamás se toca.
 *
 * Sin env vars → `configured` false y todo degrada elegante (los handlers
 * responden {count: null} / 503, el cliente esconde la UI).
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Timeout de llamadas externas: nunca colgar un handler por PostgREST caído. */
const FETCH_TIMEOUT_MS = 8_000;

export const supabase = {
  configured: Boolean(SUPABASE_URL && SERVICE_KEY),
} as const;

async function rest(path: string, init?: RequestInit): Promise<Response> {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("[supabase] no configurado (SUPABASE_URL / service key)");
  }
  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}

/** Contador actual de un slug; 0 si la fila no existe todavía. */
export async function getReactionCount(slug: string): Promise<number> {
  const res = await rest(
    `/rest/v1/blog_reactions?slug=eq.${encodeURIComponent(slug)}&select=count`,
  );
  if (!res.ok) {
    throw new Error(`[supabase] GET blog_reactions → HTTP ${res.status}`);
  }
  const rows = (await res.json()) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

/** Upsert+increment atómico vía RPC; devuelve el contador resultante. */
export async function incrementReaction(slug: string): Promise<number> {
  const res = await rest("/rest/v1/rpc/blog_increment_reaction", {
    method: "POST",
    body: JSON.stringify({ p_slug: slug }),
  });
  if (!res.ok) {
    throw new Error(
      `[supabase] rpc blog_increment_reaction → HTTP ${res.status}`,
    );
  }
  return (await res.json()) as number;
}
