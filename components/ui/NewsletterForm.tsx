"use client";

import { useId, useState, type FormEvent } from "react";
import { ui } from "@/lib/ui";

/**
 * Newsletter (T17, FR-005) — input + botón en línea, sin caja SaaS: el input
 * es un renglón (borde inferior hairline) y el botón es texto en .label con
 * el subrayado de la casa. Los estados (enviando / listo / error) son texto
 * quieto en ink-muted — sin toasts, sin popups.
 *
 * Los mensajes de error vienen del handler (/api/subscribe, strings de
 * lib/ui.ts): 503 sin key → "no disponible todavía" — el form igual se
 * renderiza siempre; cuando la key llegue a env empieza a andar sin tocar
 * markup.
 */

type Status = "idle" | "sending" | "ok" | "error";

export function NewsletterForm({ className }: { className?: string }) {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: unknown;
      } | null;
      if (res.ok) {
        setStatus("ok");
        setMessage(ui.newsletter.success);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(
          typeof data?.error === "string" ? data.error : ui.newsletter.error,
        );
      }
    } catch {
      setStatus("error");
      setMessage(ui.newsletter.error);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`print-hidden ${className ?? ""}`.trim()}
    >
      <label htmlFor={inputId} className="label block">
        {ui.newsletter.label}
      </label>
      <div className="mt-xs flex items-baseline gap-md">
        <input
          id={inputId}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={ui.newsletter.placeholder}
          disabled={status === "sending"}
          className="w-full border-b border-hairline bg-transparent pb-2xs text-body-sm text-ink transition-colors placeholder:text-ink-muted focus:border-ink-muted"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="label link-underline shrink-0 pb-2xs text-ink-secondary transition-colors hover:text-ink disabled:text-ink-muted"
        >
          {status === "sending" ? ui.newsletter.sending : ui.newsletter.submit}
        </button>
      </div>
      {message !== null && (
        <p
          role="status"
          aria-live="polite"
          className="mt-xs text-body-sm text-ink-muted"
        >
          {message}
        </p>
      )}
    </form>
  );
}
