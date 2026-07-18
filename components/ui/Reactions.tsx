"use client";

import { useEffect, useState } from "react";
import { ui } from "@/lib/ui";

/**
 * Reacciones (T16, FR-005) — bloque minimal al fin del post: prompt en .label,
 * una única marca tipográfica (asterisco de seis rayos, trazo 1px — jamás un
 * corazón) y el contador real de Supabase.
 *
 * - Contador: GET perezoso al montar; hasta entonces (o ante error / backend
 *   sin configurar) el bloque entero NO se renderiza — ausencia elegante,
 *   nunca UI rota.
 * - Tap: +1 optimista → POST → dedupe en localStorage ("blog-reacted:<slug>").
 *   Falla del POST → se revierte en silencio.
 * - Estado "ya reaccionado": botón deshabilitado en acento — el ÚNICO uso del
 *   acento en la vista de post (auditado: el chrome del post no lo gasta;
 *   DESIGN.md, principio 2).
 * - Micro-feedback de escala en CSS (.reaction-button, globals.css) con la
 *   curva de la casa; el bloque global de prefers-reduced-motion lo anula.
 */

type State =
  { phase: "pending" | "hidden" } | { phase: "ready"; count: number };

function storageKey(slug: string): string {
  return `blog-reacted:${slug}`;
}

export function Reactions({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ phase: "pending" });
  const [reacted, setReacted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      setReacted(localStorage.getItem(storageKey(slug)) === "1");
    } catch {
      /* localStorage bloqueado: sin dedupe local, el rate limit contiene */
    }
    fetch(`/api/reactions?slug=${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { count?: number | null } | null) => {
        if (cancelled) return;
        if (data && typeof data.count === "number") {
          setState({ phase: "ready", count: data.count });
        } else {
          setState({ phase: "hidden" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ phase: "hidden" });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.phase !== "ready") return null;
  const { count } = state;

  async function react() {
    if (reacted || busy) return;
    setBusy(true);
    setReacted(true);
    setState({ phase: "ready", count: count + 1 });
    try {
      localStorage.setItem(storageKey(slug), "1");
    } catch {
      /* sin persistencia local: la reacción vale igual */
    }
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { count?: number };
      if (typeof data.count === "number") {
        setState({ phase: "ready", count: data.count });
      }
    } catch {
      /* revertir en silencio: sin toasts, sin UI de error */
      setReacted(false);
      setState({ phase: "ready", count });
      try {
        localStorage.removeItem(storageKey(slug));
      } catch {
        /* ídem arriba */
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="print-hidden mt-2xl flex flex-col items-center gap-xs text-center">
      <p className="label" aria-live="polite">
        {reacted ? ui.reactions.thanks : ui.reactions.label}
      </p>
      <button
        type="button"
        onClick={react}
        disabled={reacted}
        aria-pressed={reacted}
        aria-label={ui.reactions.mark}
        className={`reaction-button flex min-h-11 items-center gap-sm px-md py-xs ${
          reacted
            ? "text-accent"
            : "text-ink-muted transition-colors hover:text-ink"
        }`}
      >
        {/* Asterisco de seis rayos — la marca de la casa, trazo fino */}
        <svg
          className="h-[18px] w-[18px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5.9 8.5l12.2 7M18.1 8.5l-12.2 7" />
        </svg>
        <span data-tnum className="font-display text-display-sm">
          {count}
        </span>
      </button>
    </div>
  );
}
