import { isAdmin } from "@/lib/admin/auth";
import { searchBooks, searchSongs } from "@/lib/admin/now-search";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { NowSearchKind, NowSearchResponse } from "@/types/now-search";

/**
 * Proxy de búsqueda para el picker de /admin/now.
 * GET ?kind=song|book&q=…  — requiere sesión de admin; sin API keys.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;
const MAX_Q = 120;
const MAX_SEARCHES_PER_MIN = 60;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function GET(request: Request): Promise<Response> {
  if (!(await isAdmin())) {
    return json({ error: "no autorizado" }, 401);
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") as NowSearchKind | null;
  const q = (url.searchParams.get("q") ?? "").trim();

  if (kind !== "song" && kind !== "book") {
    return json({ error: "kind inválido" }, 400);
  }
  if (q.length < 2) {
    return json({ error: "query demasiado corta" }, 400);
  }
  if (q.length > MAX_Q) {
    return json({ error: "query demasiado larga" }, 400);
  }
  if (
    !rateLimit(`admin-now-search:${clientIp(request)}`, MAX_SEARCHES_PER_MIN)
  ) {
    return json({ error: "Demasiadas búsquedas. Esperá un minuto." }, 429);
  }

  try {
    if (kind === "song") {
      const body: NowSearchResponse = {
        kind: "song",
        results: await searchSongs(q),
      };
      return json(body);
    }
    const body: NowSearchResponse = {
      kind: "book",
      results: await searchBooks(q),
    };
    return json(body);
  } catch (error) {
    console.error("[now-search] falló:", error);
    return json({ error: "no disponible" }, 503);
  }
}
