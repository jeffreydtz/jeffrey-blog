"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { ui } from "@/lib/ui";

/**
 * Afordancia de búsqueda en el header (T14): botón "Buscar ⌘K" en .label.
 * Abre la palette por click (también en touch) o por Cmd+K / Ctrl+K global.
 * La palette + Fuse.js se cargan recién en la primera apertura (next/dynamic,
 * ssr:false): el JS inicial del sitio no las paga. Una vez cargada queda
 * montada y solo alterna `open`.
 */
const CommandPalette = dynamic(
  () =>
    import("@/components/ui/CommandPalette").then((mod) => mod.CommandPalette),
  { ssr: false },
);

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const openPalette = useCallback(() => {
    setLoaded(true);
    setOpen(true);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setLoaded(true);
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="label link-underline weight-hover py-sm text-ink-secondary transition-colors hover:text-ink"
      >
        {ui.search.label}{" "}
        <kbd aria-hidden="true" className="font-[inherit] tracking-[inherit]">
          {ui.search.shortcutHint}
        </kbd>
      </button>
      {loaded && <CommandPalette open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
