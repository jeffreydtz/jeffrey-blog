"use client";

import { useSound } from "@/components/scroll/SoundProvider";
import { ui } from "@/lib/ui";

/**
 * Toggle de sonido de página (T08) — control discreto en el header, junto a
 * ThemeToggle. No se renderiza si el asset no existe (available=false llega
 * del servidor: server y cliente coinciden en null → sin mismatch).
 * Default off; el estado es React state, hidratación-seguro porque el primer
 * render del cliente es siempre off, igual que el SSR.
 */
export function SoundToggle() {
  const { available, enabled, toggle } = useSound();

  if (!available) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={ui.sound.toggle}
      title={enabled ? ui.sound.on : ui.sound.off}
      className="flex h-11 w-11 items-center justify-center text-ink-muted transition-colors hover:text-ink"
    >
      {/* Altavoz trazo 1px, coherente con ThemeToggle */}
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
        {enabled ? (
          /* Ondas: sonido activado */
          <path d="M15.5 9.5a4 4 0 0 1 0 5M18 7.5a7 7 0 0 1 0 9" />
        ) : (
          /* Tachado: sonido desactivado */
          <path d="M15.5 10l5 4M20.5 10l-5 4" />
        )}
      </svg>
    </button>
  );
}
