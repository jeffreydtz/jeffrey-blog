"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { LibraryBook } from "@/lib/library-data";
import { ui } from "@/lib/ui";
import type { createBookShelfScene } from "./BookShelfScene";

export function BookShelf({ books }: { books: LibraryBook[] }) {
  const detailId = useId();
  const host = useRef<HTMLDivElement>(null);
  const indexList = useRef<HTMLOListElement>(null);
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
    const list = indexList.current;
    const entry = list?.children[selected];
    if (list && entry && list.scrollWidth > list.clientWidth) {
      const listBounds = list.getBoundingClientRect();
      const entryBounds = entry.getBoundingClientRect();
      if (
        entryBounds.left < listBounds.left ||
        entryBounds.right > listBounds.right
      ) {
        list.scrollLeft += entryBounds.left - listBounds.left;
      }
    }
  }, [selected]);

  if (!books.length)
    return (
      <p className="text-body-sm text-ink-secondary">{ui.library.empty}</p>
    );

  function details(book: LibraryBook) {
    return (
      <>
        <p className="label text-ink-secondary">
          {ui.library.shelves[book.shelf]}
        </p>
        <h3 className="mt-sm font-display text-display-md text-ink">
          {book.title}
        </h3>
        <p className="mt-xs text-body text-ink-secondary">{book.author}</p>
        {book.rating ? (
          <p className="book-rating text-body-sm text-ink-secondary">
            <span aria-hidden="true" className="book-rating-marks">
              {"●".repeat(book.rating)}
              {"○".repeat(5 - book.rating)}
            </span>
            <span>
              {ui.library.rating}: {book.rating} {ui.library.outOf}
            </span>
          </p>
        ) : null}
        {book.comment ? (
          <blockquote className="book-comment text-body-sm text-ink-secondary">
            <p className="label mb-sm">{ui.library.comment}</p>
            <p>{book.comment}</p>
          </blockquote>
        ) : null}
        <a
          href={book.url}
          className="book-source link-underline text-body-sm text-ink-secondary"
          aria-label={`${ui.library.bookLink}: ${book.title}`}
        >
          {ui.library.bookLink}
          <span aria-hidden="true"> ↗</span>
        </a>
      </>
    );
  }

  return (
    <div className="library-cabinet mt-lg" data-enhanced={ready}>
      <div className="library-shelf-heading">
        <p className="label text-ink-secondary">{ui.library.collection}</p>
        <span className="label text-ink-secondary">
          {String(books.length).padStart(2, "0")} {ui.library.volumes}
        </span>
      </div>
      <div
        ref={host}
        aria-hidden="true"
        className={ready && !failed ? "bookshelf-scene" : "hidden"}
      />
      <p className="library-instructions text-body-sm text-ink-secondary">
        {failed ? ui.library.fallback : ui.library.instructions}
      </p>
      <p className="sr-only" role="status">
        {ready ? `${ui.library.selected}: ${books[selected]?.title ?? ""}` : ""}
      </p>
      <div className="library-reading">
        <div className="library-index">
          <p className="label mb-md text-ink-secondary">{ui.library.index}</p>
          <ol ref={indexList} className="min-w-0">
            {books.map((book, index) => (
              <li
                key={book.id}
                className="book-entry min-w-0"
                data-selected={ready && index === selected}
              >
                {ready ? (
                  <button
                    type="button"
                    className="book-choice"
                    aria-pressed={index === selected}
                    aria-controls={detailId}
                    aria-label={`${ui.library.select}: ${book.title}`}
                    onClick={() => setSelected(index)}
                  >
                    <span className="book-number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="book-index-title">{book.title}</span>
                      <span className="book-index-author">{book.author}</span>
                    </span>
                    <span className="book-index-marker" aria-hidden="true">
                      ↗
                    </span>
                  </button>
                ) : (
                  <div className="book-static-detail">{details(book)}</div>
                )}
              </li>
            ))}
          </ol>
        </div>
        {ready && books[selected] ? (
          <section
            className="book-detail"
            id={detailId}
            aria-label={ui.library.selected}
          >
            <p className="book-detail-folio font-display" aria-hidden="true">
              {String(selected + 1).padStart(2, "0")}
            </p>
            {details(books[selected])}
          </section>
        ) : null}
      </div>
    </div>
  );
}
