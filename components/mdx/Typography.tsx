import type { ReactNode } from "react";

/**
 * Overrides tipográficos menores — T11.
 * Blockquote editorial: márgenes generosos, filete hairline a la izquierda,
 * SIN itálica (old money es contención, no énfasis teatral).
 * Hr: el divisor único del sitio (.hairline).
 */

export function Blockquote({ children }: { children?: ReactNode }) {
  return (
    <blockquote className="my-xl border-l border-hairline py-2xs pl-lg text-ink-secondary">
      {children}
    </blockquote>
  );
}

export function Hr() {
  return <hr className="hairline" />;
}
