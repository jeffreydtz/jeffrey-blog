"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import styles from "./ReadingShelf.module.css";

export type ReadingBook = {
  title: string;
  author: string;
  coverUrl: string;
  rating: number | null;
  averageRating: number | null;
  publishedYear: number | null;
  goodreadsUrl: string;
  review?: string;
};

type ReadingShelfProps = {
  books: ReadingBook[];
  shelfUrl?: string;
};

const COPY = {
  heading: "Lo que leí",
  myScore: "Mi nota",
  average: "Promedio Goodreads",
  published: "Publicado",
  about: "Acerca",
  viewOnGoodreads: "Ver en Goodreads",
  notRated: "Sin nota",
  previous: "Libro anterior",
  next: "Libro siguiente",
  browse: "Recorrer el estante",
  choose: "Elegir un libro",
  close: "Cerrar",
  aboutBook: "Sobre el libro",
  books: "libros",
  goodreads: "Goodreads",
  selected: "Libro seleccionado",
};

function clamp(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.min(length - 1, Math.max(0, index));
}

function formatAverage(value: number | null) {
  if (value === null) return "—";
  return value.toFixed(2).replace(/\.00$/, "");
}

function StarRow({ value }: { value: number | null }) {
  if (value === null) {
    return <span className={styles.muted}>{COPY.notRated}</span>;
  }
  const filled = Math.round(value);
  return (
    <span className={styles.stars} aria-label={`${value} de 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={index < filled ? styles.starOn : styles.starOff}
        >
          <path d="M10 1.6 12.4 7l6 .5-4.6 3.9 1.4 5.8L10 14.6 4.8 17.2l1.4-5.8L1.6 7.5l6-.5L10 1.6Z" />
        </svg>
      ))}
    </span>
  );
}

function Cover({
  book,
  sizes,
  priority,
}: {
  book: ReadingBook;
  sizes: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(!book.coverUrl);
  if (failed) {
    return (
      <div className={styles.plate}>
        <span className={styles.plateTitle}>{book.title}</span>
        <span className={styles.plateAuthor}>{book.author}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote Goodreads/Open Library covers; no wildcard remotePatterns.
    <img
      src={book.coverUrl}
      alt=""
      draggable={false}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      sizes={sizes}
      className={styles.art}
      onError={() => setFailed(true)}
    />
  );
}

function Volume({
  book,
  active,
  offset,
  index,
}: {
  book: ReadingBook;
  active: boolean;
  offset: number;
  index: number;
}) {
  const depth = 0.82 + (index % 5) * 0.14;
  return (
    <div
      className={styles.volume}
      data-active={active}
      style={
        {
          "--offset": offset,
          "--depth": `${depth}rem`,
        } as CSSProperties
      }
    >
      <div className={styles.spine} aria-hidden="true">
        <span>{book.title}</span>
      </div>
      <div className={styles.cover}>
        <Cover
          book={book}
          sizes="(max-width: 640px) 42vw, 12rem"
          priority={index < 3}
        />
      </div>
      <div className={styles.pages} aria-hidden="true" />
    </div>
  );
}

export function ReadingShelf({ books, shelfUrl }: ReadingShelfProps) {
  const dialogId = useId();
  const railRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLOListElement>(null);
  const aboutRef = useRef<HTMLDialogElement>(null);
  const drag = useRef<{
    id: number;
    x: number;
    origin: number;
    moved: boolean;
  } | null>(null);
  const skipClick = useRef(false);
  const [selected, setSelected] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const current = books[selected];
  const hasAbout = Boolean(current?.review?.trim());

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const syncFromRail = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    for (const [index, node] of Array.from(rail.children).entries()) {
      const slide = node as HTMLElement;
      const mid = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(mid - center);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    }
    setSelected(nearest);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const onScroll = () => {
      if (drag.current?.moved) return;
      syncFromRail();
    };
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      rail.scrollLeft += event.deltaY;
      event.preventDefault();
    };
    rail.addEventListener("scroll", onScroll, { passive: true });
    rail.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      rail.removeEventListener("scroll", onScroll);
      rail.removeEventListener("wheel", onWheel);
    };
  }, [syncFromRail]);

  useEffect(() => {
    const item = stripRef.current?.children[selected];
    if (item instanceof HTMLElement) {
      item.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
  }, [selected, reduceMotion]);

  const goTo = useCallback(
    (index: number) => {
      const next = clamp(index, books.length);
      setSelected(next);
      const slide = railRef.current?.children[next];
      if (slide instanceof HTMLElement) {
        slide.scrollIntoView({
          inline: "center",
          block: "nearest",
          behavior: reduceMotion ? "auto" : "smooth",
        });
      }
    },
    [books.length, reduceMotion],
  );

  function onRailKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(selected + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(selected - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(books.length - 1);
    }
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rail = railRef.current;
    if (!rail) return;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      origin: rail.scrollLeft,
      moved: false,
    };
    rail.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const rail = railRef.current;
    if (!state || state.id !== event.pointerId || !rail) return;
    const delta = event.clientX - state.x;
    if (Math.abs(delta) > 6) state.moved = true;
    if (state.moved) rail.scrollLeft = state.origin - delta;
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    drag.current = null;
    if (state.moved) {
      skipClick.current = true;
      syncFromRail();
    }
  }

  function openAbout() {
    aboutRef.current?.showModal();
  }

  if (!books.length || !current) return null;

  const titleClass =
    current.title.length > 56
      ? styles.titleLong
      : current.title.length > 32
        ? styles.titleMedium
        : styles.title;

  return (
    <section className={styles.archive} aria-labelledby="reading-shelf-title">
      <header className={styles.topbar}>
        <h2 id="reading-shelf-title" className={styles.brand}>
          {COPY.heading}
        </h2>
        {shelfUrl ? (
          <a
            className={styles.meta}
            href={shelfUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>
              {books.length} {COPY.books}
            </span>
            <span aria-hidden="true" className={styles.dot}>
              ·
            </span>
            <span>{COPY.goodreads}</span>
            <span aria-hidden="true">↗</span>
          </a>
        ) : null}
      </header>

      <div className={styles.stage}>
        <div
          ref={railRef}
          className={styles.rail}
          tabIndex={0}
          role="listbox"
          aria-label={COPY.browse}
          aria-activedescendant={`reading-slide-${selected}`}
          onKeyDown={onRailKey}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {books.map((book, index) => (
            <div
              key={`${book.title}-${index}`}
              id={`reading-slide-${index}`}
              className={styles.slide}
              role="option"
              aria-selected={index === selected}
            >
              <button
                type="button"
                className={styles.pick}
                aria-label={`${book.title}, ${book.author}`}
                onClick={() => {
                  if (skipClick.current) {
                    skipClick.current = false;
                    return;
                  }
                  goTo(index);
                }}
              >
                <Volume
                  book={book}
                  active={index === selected}
                  offset={index - selected}
                  index={index}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <section
        className={styles.copy}
        aria-label={COPY.selected}
        aria-live="polite"
      >
        <p className={styles.eyebrow}>
          <span>{String(selected + 1).padStart(2, "0")}</span>
        </p>
        <h3 className={titleClass}>{current.title}</h3>
        <p className={styles.author}>{current.author}</p>
        <dl className={styles.stats}>
          <div>
            <dt>{COPY.myScore}</dt>
            <dd>
              <StarRow value={current.rating} />
            </dd>
          </div>
          <div>
            <dt>{COPY.average}</dt>
            <dd data-tnum>{formatAverage(current.averageRating)}</dd>
          </div>
          <div>
            <dt>{COPY.published}</dt>
            <dd data-tnum>{current.publishedYear ?? "—"}</dd>
          </div>
        </dl>
        <div className={styles.actions}>
          {hasAbout ? (
            <button type="button" className={styles.pill} onClick={openAbout}>
              {COPY.about}
            </button>
          ) : null}
          {current.goodreadsUrl ? (
            <a
              className={styles.pill}
              href={current.goodreadsUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {COPY.viewOnGoodreads}
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      </section>

      <nav className={styles.gallery} aria-label={COPY.browse}>
        <button
          type="button"
          className={styles.arrow}
          aria-label={COPY.previous}
          disabled={selected === 0}
          onClick={() => goTo(selected - 1)}
        >
          <Arrow direction="left" />
        </button>
        <div className={styles.scrub}>
          <ol ref={stripRef} className={styles.strip} aria-label={COPY.choose}>
            {books.map((book, index) => (
              <li key={`thumb-${book.title}-${index}`}>
                <button
                  type="button"
                  className={styles.thumb}
                  aria-current={index === selected}
                  aria-label={`${book.title}, ${book.author}`}
                  title={`${book.title} — ${book.author}`}
                  onClick={() => goTo(index)}
                >
                  <Cover book={book} sizes="40px" />
                </button>
              </li>
            ))}
          </ol>
        </div>
        <button
          type="button"
          className={styles.arrow}
          aria-label={COPY.next}
          disabled={selected === books.length - 1}
          onClick={() => goTo(selected + 1)}
        >
          <Arrow direction="right" />
        </button>
        <p className={styles.count} data-tnum>
          {selected + 1} / {books.length}
        </p>
      </nav>

      <dialog
        ref={aboutRef}
        id={dialogId}
        className={styles.notes}
        aria-labelledby={`${dialogId}-title`}
      >
        <div className={styles.notesHeader}>
          <p className={styles.notesKicker}>{COPY.aboutBook}</p>
          <button
            type="button"
            className={styles.notesClose}
            aria-label={COPY.close}
            onClick={() => aboutRef.current?.close()}
          >
            ×
          </button>
        </div>
        <div className={styles.notesBody}>
          <h4 id={`${dialogId}-title`}>{current.title}</h4>
          <p className={styles.notesAuthor}>{current.author}</p>
          <p>{current.review}</p>
        </div>
      </dialog>
    </section>
  );
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={direction === "right" ? styles.arrowFlip : undefined}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M9.707 16.707a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 1.414L5.414 9H17a1 1 0 1 1 0 2H5.414l4.293 4.293a1 1 0 0 1 0 1.414Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
