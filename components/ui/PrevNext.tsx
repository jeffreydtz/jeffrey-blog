"use client";
import { localizedPath } from "@/lib/i18n/routing";

import Link from "next/link";
import { useSound } from "@/components/scroll/SoundProvider";
import { useI18n } from "@/lib/i18n/client";

export interface PrevNextItem {
  slug: string;
  title: string;
}

/**
 * Navegación prev/next (T12) — prev = ensayo más viejo (izquierda),
 * next = más nuevo (derecha). Client component por el foley: el click
 * dispara playPageTurn() (no-op sin asset/apagado). La microinteracción
 * de "vuelta de página" es CSS puro (.page-flip/.page-corner en
 * globals.css): la etiqueta se levanta como una esquina de página,
 * coherente con el pergamino, anulada bajo prefers-reduced-motion.
 */
export function PrevNext({
  prev,
  next,
}: {
  prev: PrevNextItem | null;
  next: PrevNextItem | null;
}) {
  const { locale, ui } = useI18n();
  const { playPageTurn } = useSound();

  if (prev === null && next === null) return null;

  return (
    <nav aria-label={ui.post.pagination} className="print-hidden mt-2xl">
      <div className="hairline" />
      <div className="grid gap-lg py-lg sm:grid-cols-2">
        <div>
          {prev !== null && (
            <Link
              href={localizedPath(`/posts/${prev.slug}`, locale)}
              onClick={playPageTurn}
              className="page-flip group block py-sm"
              rel="prev"
            >
              <span className="page-corner label">
                &larr; {ui.post.previous}
              </span>
              <span className="mt-xs block font-display text-display-sm text-ink transition-colors group-hover:text-ink-secondary">
                {prev.title}
              </span>
            </Link>
          )}
        </div>
        <div className="sm:text-right">
          {next !== null && (
            <Link
              href={localizedPath(`/posts/${next.slug}`, locale)}
              onClick={playPageTurn}
              className="page-flip group block py-sm"
              data-side="next"
              rel="next"
            >
              <span className="page-corner label">{ui.post.next} &rarr;</span>
              <span className="mt-xs block font-display text-display-sm text-ink transition-colors group-hover:text-ink-secondary">
                {next.title}
              </span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
