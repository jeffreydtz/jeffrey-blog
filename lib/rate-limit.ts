import "server-only";

/**
 * Rate limit por IP compartido por los dos route handlers (T16/T17).
 *
 * HONESTIDAD: es un Map en memoria del proceso — best-effort POR INSTANCIA
 * serverless. En Vercel cada instancia caliente tiene su propio Map y un cold
 * start lo resetea; instancias paralelas no comparten estado. Aceptado por
 * plan.md (riesgo "endpoint spameable"): la defensa real es la combinación
 * slug-validado + dedupe localStorage + este freno, no una garantía global.
 *
 * CONFIANZA EN LA IP: el primer valor de x-forwarded-for es confiable SOLO
 * detrás de Vercel (la plataforma lo sobrescribe con la IP real; el cliente no
 * puede anteponer valores). En cualquier otro despliegue (next start directo,
 * proxy propio) el header es controlable por el atacante y este límite es
 * meramente indicativo.
 */

const WINDOW_MS = 60_000;
/** Tope de claves vivas: ante un flood de IPs se poda antes de crecer sin límite. */
const MAX_KEYS = 5_000;

const hitsByKey = new Map<string, number[]>();

/** Primer valor de x-forwarded-for (Vercel lo setea con la IP real del cliente). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function prune(now: number): void {
  for (const [key, hits] of hitsByKey) {
    if (hits.every((t) => now - t >= WINDOW_MS)) hitsByKey.delete(key);
  }
}

/**
 * true = permitido (y consume un hit); false = límite alcanzado.
 * `max` = hits por ventana de 60s para esa clave (p. ej. "reactions:1.2.3.4").
 */
export function rateLimit(key: string, max: number): boolean {
  const now = Date.now();
  if (hitsByKey.size >= MAX_KEYS) {
    prune(now);
    // Flood de claves únicas dentro de la ventana: prune() no alcanza porque
    // nada expiró todavía. El tope debe sostenerse igual — se desaloja lo más
    // viejo (orden de inserción del Map) hasta volver bajo el límite.
    if (hitsByKey.size >= MAX_KEYS) {
      const excess = hitsByKey.size - MAX_KEYS + 1;
      const oldest = hitsByKey.keys();
      for (let i = 0; i < excess; i++) {
        const evictKey = oldest.next().value;
        if (evictKey === undefined) break;
        hitsByKey.delete(evictKey);
      }
    }
  }

  const recent = (hitsByKey.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    hitsByKey.set(key, recent);
    return false;
  }
  recent.push(now);
  hitsByKey.set(key, recent);
  return true;
}
