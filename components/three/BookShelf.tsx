"use client";

import { useEffect, useRef, useState } from "react";
import type { LibraryBook } from "@/lib/library-data";
import { ui } from "@/lib/ui";
import type { createBookShelfScene } from "./BookShelfScene";

export function BookShelf({ books }: { books: LibraryBook[] }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createBookShelfScene> | null>(null);
  const selection = useRef(0);
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setReady(true);
    if (!host.current || books.length === 0) return;
    let cancelled = false;
    const container = host.current;
    // Import both the renderer and Three only when the shelf approaches the viewport.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        void import("./BookShelfScene")
          .then(({ createBookShelfScene }) => {
            if (cancelled) return;
            scene.current = createBookShelfScene(
              container,
              books,
              setSelected,
              () => setFailed(true),
            );
            scene.current.select(selection.current);
          })
          .catch(() => {
            if (!cancelled) setFailed(true);
          });
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);
    return () => {
      cancelled = true;
      observer.disconnect();
      scene.current?.dispose();
      scene.current = null;
    };
  }, [books]);

  useEffect(() => {
    selection.current = selected;
    scene.current?.select(selected);
  }, [selected]);

  if (!books.length)
    return (
      <p className="text-body-sm text-ink-secondary">{ui.library.empty}</p>
    );

  return (
    <div className="mt-lg">
      <div
        ref={host}
        aria-hidden="true"
        className={ready && !failed ? "bookshelf-scene" : "hidden"}
      />
      <p className="mb-lg text-body-sm text-ink-secondary">
        {failed ? ui.library.fallback : ui.library.instructions}
      </p>
      <p className="sr-only" role="status">
        {ready ? `${ui.library.selected}: ${books[selected]?.title ?? ""}` : ""}
      </p>
      <ol className="grid min-w-0 gap-x-lg sm:grid-cols-2">
        {books.map((book, index) => {
          const shelf =
            ui.library.shelves[book.shelf as keyof typeof ui.library.shelves] ??
            book.shelf;
          return (
            <li
              key={book.id}
              className="book-entry min-w-0"
              data-selected={ready && index === selected}
            >
              <p className="label mb-xs text-ink-secondary">
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, "0")} ·{" "}
                </span>
                {shelf}
              </p>
              <h3 className="font-display text-display-sm text-ink">
                {ready ? (
                  <button
                    type="button"
                    className="book-choice"
                    aria-pressed={index === selected}
                    aria-label={`${ui.library.select}: ${book.title}`}
                    onClick={() => setSelected(index)}
                  >
                    {book.title}
                  </button>
                ) : (
                  <a href={book.url} className="book-choice link-underline">
                    {book.title}
                  </a>
                )}
              </h3>
              <p className="text-body-sm text-ink-secondary">{book.author}</p>
              {book.rating ? (
                <p className="text-body-sm text-ink-secondary">
                  {ui.library.rating}: {book.rating} {ui.library.outOf}
                </p>
              ) : null}
              {book.comment ? (
                <p className="mt-xs text-body-sm text-ink-secondary">
                  <span className="sr-only">{ui.library.comment}: </span>
                  {book.comment}
                </p>
              ) : null}
              <a
                href={book.url}
                className="link-underline inline-flex min-h-[var(--control-target)] items-center text-body-sm text-ink-secondary"
                aria-label={`${ui.library.bookLink}: ${book.title}`}
              >
                {ui.library.bookLink}
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
