import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Auth del panel /admin — sesión propia, sin dependencias nuevas.
 *
 * Modelo: una sola persona (el autor). Login por contraseña (ADMIN_PASSWORD)
 * → cookie httpOnly firmada con HMAC-SHA256. La clave de firma se deriva de
 * la contraseña: cambiarla invalida todas las sesiones vivas. Sin base de
 * datos de sesiones — coherente con el resto del sitio.
 *
 * El panel entero queda deshabilitado (404 funcional) si faltan las env vars:
 * sin ADMIN_PASSWORD no hay nada que adivinar.
 */

const COOKIE_NAME = "admin_session";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export function adminEnabled(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.GITHUB_TOKEN);
}

/** Clave de firma derivada de la contraseña (rotarla revoca sesiones). */
function signingKey(): Buffer {
  return createHmac("sha256", "jeffrey-blog-admin-session-v1")
    .update(process.env.ADMIN_PASSWORD ?? "")
    .digest();
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("hex");
}

/** Comparación en tiempo constante; longitudes distintas no cortocircuitan barato. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(signingKey(), signingKey());
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}

export async function createSession(): Promise<void> {
  const exp = String(Date.now() + SESSION_MS);
  (await cookies()).set(COOKIE_NAME, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  if (!adminEnabled()) return false;
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return false;
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return false;
  const exp = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now();
}

/** Toda página y acción del panel arranca acá — capa única de defensa real. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** IP para el rate limit del login (mismo criterio que lib/rate-limit.ts). */
export async function adminClientIp(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
