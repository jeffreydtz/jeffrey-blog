"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Field, inputClass } from "@/components/admin/Field";
import type { BookHit, NowSearchResponse, SongHit } from "@/types/now-search";

/**
 * Picker de iTunes / OpenLibrary para /admin/now. Debounce + lista quieta
 * (thumb, título, crédito). Elegir rellena los campos; no submitea el form.
 */

const DEBOUNCE_MS = 350;

type Hit = SongHit | BookHit;

type NowSearchProps =
  | { kind: "song"; label: string; onPick: (hit: SongHit) => void }
  | { kind: "book"; label: string; onPick: (hit: BookHit) => void };

export function NowSearch({ kind, label, onPick }: NowSearchProps) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">(
    "idle",
  );
  const [results, setResults] = useState<Hit[]>([]);
  const [error, setError] = useState("");
  const pickedRef = useRef(false);

  useEffect(() => {
    const q = query.trim();
    if (pickedRef.current) {
      pickedRef.current = false;
      return;
    }
    if (q.length < 2) {
      setResults([]);
      setStatus("idle");
      setError("");
      return;
    }

    const ac = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      setError("");
      try {
        const res = await fetch(
          `/api/admin/now-search?kind=${kind}&q=${encodeURIComponent(q)}`,
          { signal: ac.signal },
        );
        if (res.status === 401) {
          setStatus("error");
          setError("Sesión vencida. Recargá e iniciá de nuevo.");
          return;
        }
        if (res.status === 429) {
          setStatus("error");
          setError("Demasiadas búsquedas. Esperá un minuto.");
          return;
        }
        if (!res.ok) {
          setStatus("error");
          setError("No se pudo buscar.");
          return;
        }
        const body = (await res.json()) as NowSearchResponse;
        if (body.kind !== kind) {
          setStatus("error");
          setError("No se pudo buscar.");
          return;
        }
        const hits = body.results;
        setResults(hits);
        setStatus(hits.length === 0 ? "empty" : "idle");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
        setError("No se pudo buscar.");
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [query, kind]);

  function pick(hit: Hit) {
    pickedRef.current = true;
    if (kind === "song") {
      if ("artwork" in hit) onPick(hit);
    } else if (!("artwork" in hit)) {
      onPick(hit);
    }
    setQuery("");
    setResults([]);
    setStatus("idle");
    setError("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (results[0]) pick(results[0]);
  }

  return (
    <div>
      <Field label={label}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={label}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          aria-controls={listId}
          className={inputClass}
        />
      </Field>
      {status === "loading" && (
        <p className="mt-xs text-body-sm text-ink-muted">Buscando…</p>
      )}
      {status === "empty" && (
        <p className="mt-xs text-body-sm text-ink-muted">Sin resultados.</p>
      )}
      {status === "error" && error && (
        <p role="status" className="mt-xs text-body-sm text-accent">
          {error}
        </p>
      )}
      {results.length > 0 && (
        <ul
          id={listId}
          aria-label={label}
          className="mt-sm border border-hairline"
        >
          {results.map((hit) => (
            <li
              key={hit.id}
              className="border-t border-hairline first:border-t-0"
            >
              <button
                type="button"
                onClick={() => pick(hit)}
                className="flex w-full items-center gap-sm px-sm py-xs text-left transition-colors hover:bg-paper-raised focus:bg-paper-raised focus:outline focus:outline-1 focus:outline-ink"
              >
                <Thumb src={hit.thumb} />
                <span className="min-w-0">
                  <span className="block truncate text-body-sm text-ink">
                    {hit.title}
                  </span>
                  <span className="block truncate text-body-sm text-ink-muted">
                    {creditOf(hit)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function creditOf(hit: Hit): string {
  if ("album" in hit) {
    return hit.album ? `${hit.artist} — ${hit.album}` : hit.artist;
  }
  return hit.year ? `${hit.author} · ${hit.year}` : hit.author;
}

function Thumb({ src }: { src: string | null }) {
  if (!src) {
    return (
      <span
        aria-hidden
        className="size-lg shrink-0 rounded-subtle border border-hairline bg-paper-raised"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- portada remota de iTunes/OpenLibrary; sin remotePatterns comodín
    <img
      src={src}
      alt=""
      width={32}
      height={32}
      loading="lazy"
      decoding="async"
      className="size-lg shrink-0 rounded-subtle border border-hairline object-cover"
    />
  );
}
