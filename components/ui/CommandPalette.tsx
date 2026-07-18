"use client";

import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSound } from "@/components/scroll/SoundProvider";
import { formatDate, ui } from "@/lib/ui";
import type { SearchDoc } from "@/types/search";

/**
 * Command palette (T14, FR-002) — Cmd+K / Ctrl+K. Contraste "moderno"
 * INTENCIONAL dentro del sistema: mismos tokens, ejecución nítida — panel
 * paper-raised, borde hairline de 1px, radius subtle, input en mono.
 * Se carga lazy vía next/dynamic desde SearchButton: Fuse.js y este archivo
 * no viajan en el JS inicial. Enhancement puro: sin JS el sitio navega igual.
 *
 * Semántica: dialog modal + combobox/listbox, focus trap (el único foco es
 * el input), scroll lock, backdrop cierra, aria-activedescendant para la
 * opción activa. Tags: sin ruta /tags — elegir un tema filtra los ensayos
 * dentro de la propia palette (query = tag).
 */

const PAGES = [
  { href: "/", label: ui.nav.home },
  { href: "/archivo", label: ui.nav.archive },
  { href: "/acerca", label: ui.nav.about },
  { href: "/colofon", label: ui.nav.colophon },
] as const;

const MAX_POSTS = 8;
const MAX_TAGS = 6;

type PaletteItem =
  | { kind: "post"; doc: SearchDoc }
  | { kind: "page"; href: string; label: string }
  | { kind: "tag"; tag: string };

interface Group {
  label: string;
  items: PaletteItem[];
}

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { playPageTurn } = useSound();
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Índice: un solo fetch en el primer montaje (que ya es el primer open).
  useEffect(() => {
    let cancelled = false;
    fetch("/search-index.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SearchDoc[]) => {
        if (!cancelled) setDocs(data);
      })
      .catch(() => {
        if (!cancelled) setDocs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Abrir: guardar foco previo, resetear estado, foco al input, scroll lock.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [open]);

  const fuse = useMemo(
    () =>
      docs === null
        ? null
        : new Fuse(docs, {
            keys: [
              { name: "title", weight: 2 },
              { name: "tags", weight: 1.5 },
              { name: "excerpt", weight: 1 },
            ],
            threshold: 0.35,
            ignoreLocation: true,
          }),
    [docs],
  );

  const groups = useMemo<Group[]>(() => {
    const all = docs ?? [];
    const trimmed = query.trim();
    const lower = trimmed.toLowerCase();

    const posts: SearchDoc[] =
      trimmed === "" || fuse === null
        ? all.slice(0, MAX_POSTS)
        : fuse
            .search(trimmed)
            .slice(0, MAX_POSTS)
            .map((result) => result.item);

    const pages = PAGES.filter(
      (page) => trimmed === "" || page.label.toLowerCase().includes(lower),
    );

    const tags = [...new Set(all.flatMap((doc) => doc.tags))]
      .filter((tag) => trimmed === "" || tag.toLowerCase().includes(lower))
      .slice(0, MAX_TAGS);

    return [
      {
        label: ui.search.sectionPosts,
        items: posts.map((doc): PaletteItem => ({ kind: "post", doc })),
      },
      {
        label: ui.search.sectionPages,
        items: pages.map((page): PaletteItem => ({ kind: "page", ...page })),
      },
      {
        label: ui.search.sectionTags,
        items: tags.map((tag): PaletteItem => ({ kind: "tag", tag })),
      },
    ].filter((group) => group.items.length > 0);
  }, [docs, fuse, query]);

  const flatItems = useMemo(
    () => groups.flatMap((group) => group.items),
    [groups],
  );

  // La opción activa nunca apunta fuera de la lista actual.
  const boundedIndex = Math.min(activeIndex, Math.max(flatItems.length - 1, 0));
  const activeId =
    flatItems.length > 0 ? `palette-option-${boundedIndex}` : undefined;

  useEffect(() => {
    if (activeId !== undefined) {
      document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
    }
  }, [activeId]);

  function activate(item: PaletteItem) {
    if (item.kind === "tag") {
      // Filter-jump: el tema se vuelve query y filtra los ensayos acá mismo.
      setQuery(item.tag);
      setActiveIndex(0);
      inputRef.current?.focus();
      return;
    }
    const href = item.kind === "post" ? `/posts/${item.doc.slug}` : item.href;
    if (item.kind === "post") playPageTurn();
    onClose();
    router.push(href);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (flatItems.length > 0) {
          setActiveIndex((boundedIndex + 1) % flatItems.length);
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (flatItems.length > 0) {
          setActiveIndex(
            (boundedIndex - 1 + flatItems.length) % flatItems.length,
          );
        }
        break;
      case "Enter": {
        event.preventDefault();
        const item = flatItems[boundedIndex];
        if (item !== undefined) activate(item);
        break;
      }
      case "Escape":
        event.preventDefault();
        onClose();
        break;
      case "Tab":
        // Focus trap: el input es el único elemento enfocable del diálogo.
        event.preventDefault();
        break;
    }
  }

  if (!open) return null;

  let optionIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-lg pt-[16vh]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-ink/20"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ui.search.label}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-palette rounded-subtle border border-hairline bg-paper-raised"
      >
        <div className="flex items-center gap-md border-b border-hairline px-md py-sm">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-listbox"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label={ui.search.label}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={ui.search.placeholder}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            className="w-full bg-transparent py-xs font-mono text-body-sm text-ink outline-none placeholder:text-ink-muted"
          />
          <kbd aria-hidden="true" className="label shrink-0">
            esc
          </kbd>
        </div>
        <div
          id="palette-listbox"
          role="listbox"
          aria-label={ui.search.label}
          className="max-h-[55vh] overflow-y-auto py-xs"
        >
          {flatItems.length === 0 ? (
            <p className="px-md py-lg text-body-sm text-ink-muted">
              {ui.search.empty}
            </p>
          ) : (
            groups.map((group) => (
              <div role="group" aria-label={group.label} key={group.label}>
                <p aria-hidden="true" className="label px-md pb-xs pt-md">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  optionIndex += 1;
                  const index = optionIndex;
                  const active = index === boundedIndex;
                  const key =
                    item.kind === "post"
                      ? `post-${item.doc.slug}`
                      : item.kind === "page"
                        ? `page-${item.href}`
                        : `tag-${item.tag}`;
                  return (
                    <div
                      key={key}
                      id={`palette-option-${index}`}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => activate(item)}
                      className={`flex cursor-pointer items-baseline justify-between gap-md px-md py-xs text-body-sm ${
                        active ? "bg-selection text-ink" : "text-ink-secondary"
                      }`}
                    >
                      {item.kind === "post" ? (
                        <>
                          <span
                            lang={item.doc.lang}
                            className="min-w-0 truncate font-display"
                          >
                            {item.doc.title}
                          </span>
                          <time
                            dateTime={item.doc.published_at}
                            className="label shrink-0"
                          >
                            {formatDate(item.doc.published_at, item.doc.lang)}
                          </time>
                        </>
                      ) : item.kind === "page" ? (
                        <>
                          <span className="min-w-0 truncate">{item.label}</span>
                          <span className="label shrink-0">{item.href}</span>
                        </>
                      ) : (
                        <span className="min-w-0 truncate">{item.tag}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
