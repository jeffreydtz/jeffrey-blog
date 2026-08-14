import type { ReactNode } from "react";

/**
 * Piezas de formulario del panel /admin — tokens de la casa, sin cromo:
 * label en mayúscula-tracking, inputs con borde hairline sobre papel,
 * esquinas rectas. Server components puros (los forms usan server actions).
 */

export const inputClass =
  "w-full border border-hairline bg-paper px-sm py-xs font-body text-body-sm text-ink placeholder:text-ink-muted focus:outline focus:outline-1 focus:outline-ink";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label mb-2xs block">{label}</span>
      {children}
    </label>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="label cursor-pointer border border-hairline bg-paper-raised px-md py-sm text-ink transition-colors hover:bg-paper focus:outline focus:outline-1 focus:outline-ink"
    >
      {children}
    </button>
  );
}

/** Aviso post-acción (?m=) o error de validación (?e=). */
export function Notice({
  message,
  error,
}: {
  message?: string;
  error?: string;
}) {
  if (!message && !error) return null;
  return (
    <p
      role="status"
      className={`mb-lg border border-hairline px-md py-sm text-body-sm ${
        error ? "text-accent" : "text-ink-secondary"
      }`}
    >
      {error ?? message}
    </p>
  );
}
