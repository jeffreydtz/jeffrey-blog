import { clientIp, rateLimit } from "@/lib/rate-limit";
import { ui } from "@/lib/ui";

/**
 * Newsletter (T17, FR-005) — el otro de los DOS handlers no estáticos.
 *
 * POST { email } → Buttondown API → { ok: true }.
 * Los errores vuelven como { error: <string amigable de lib/ui.ts> } — el
 * cliente los muestra tal cual; la respuesta cruda de Buttondown jamás se
 * reenvía. Sin BUTTONDOWN_API_KEY → 503 "no disponible": el form existe en
 * el markup desde ya y empieza a funcionar apenas la key aparezca en env,
 * sin redeploy de UI.
 */

export const runtime = "nodejs";

const BUTTONDOWN_ENDPOINT = "https://api.buttondown.email/v1/subscribers";
const FETCH_TIMEOUT_MS = 10_000;
/** Máx. altas por IP por minuto (ventana de lib/rate-limit). */
const MAX_SUBSCRIBES_PER_MIN = 5;

/** Validación pragmática de formato; la autoridad final es Buttondown. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request): Promise<Response> {
  let email: unknown;
  try {
    ({ email } = (await request.json()) as { email?: unknown });
  } catch {
    return Response.json({ error: ui.newsletter.invalid }, { status: 400 });
  }
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !EMAIL_RE.test(email)
  ) {
    return Response.json({ error: ui.newsletter.invalid }, { status: 400 });
  }

  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    return Response.json({ error: ui.newsletter.unavailable }, { status: 503 });
  }

  if (!rateLimit(`subscribe:${clientIp(request)}`, MAX_SUBSCRIBES_PER_MIN)) {
    return Response.json({ error: ui.newsletter.error }, { status: 429 });
  }

  try {
    const res = await fetch(BUTTONDOWN_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email_address: email }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (res.ok) {
      return Response.json({ ok: true });
    }

    /* 4xx de Buttondown: distinguir "ya suscripto" por su código estable;
       el resto se colapsa al error genérico (sin filtrar el body crudo). */
    const body = (await res.json().catch(() => null)) as {
      code?: unknown;
    } | null;
    if (typeof body?.code === "string" && body.code.includes("already")) {
      return Response.json({ error: ui.newsletter.already }, { status: 409 });
    }
    console.error(`[subscribe] Buttondown → HTTP ${res.status}`);
    return Response.json({ error: ui.newsletter.error }, { status: 502 });
  } catch (error) {
    console.error("[subscribe] Buttondown inalcanzable:", error);
    return Response.json({ error: ui.newsletter.error }, { status: 502 });
  }
}
