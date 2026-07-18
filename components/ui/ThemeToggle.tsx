"use client";

import { ui } from "@/lib/ui";

/**
 * Alterna la clase "dark" en <html> y persiste en localStorage.
 * Los íconos se resuelven por CSS (dark:hidden / hidden dark:inline) para
 * evitar mismatch de hidratación: el estado vive en el DOM, no en React.
 */
export function ThemeToggle() {
  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* localStorage bloqueado: el tema igual cambia para esta vista */
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={ui.theme.toggle}
      title={ui.theme.toggle}
      className="-mr-sm flex h-11 w-11 items-center justify-center text-ink-muted transition-colors hover:text-ink"
    >
      {/* Sol — visible en tema claro */}
      <svg
        className="h-[18px] w-[18px] dark:hidden"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
      </svg>
      {/* Luna — visible en pergamino nocturno */}
      <svg
        className="hidden h-[18px] w-[18px] dark:inline"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
      </svg>
    </button>
  );
}
