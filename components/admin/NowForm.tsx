"use client";

import { useRef, type RefObject } from "react";
import { saveNowAction } from "@/app/admin/actions";
import { Field, SubmitButton, inputClass } from "@/components/admin/Field";
import { NowSearch } from "@/components/admin/NowSearch";
import type { BookHit, SongHit } from "@/types/now-search";

export interface NowFormValues {
  listeningTitle: string;
  listeningArtist: string;
  listeningCover: string;
  readingTitle: string;
  readingAuthor: string;
  readingCover: string;
}

/**
 * Formulario de /admin/now: pickers de búsqueda + campos manuales.
 * Los inputs son no-controlados para que elegir un resultado y seguir
 * editando a mano no peleen con React.
 */

export function NowForm({ values }: { values: NowFormValues }) {
  const listeningTitle = useRef<HTMLInputElement>(null);
  const listeningArtist = useRef<HTMLInputElement>(null);
  const listeningCover = useRef<HTMLInputElement>(null);
  const readingTitle = useRef<HTMLInputElement>(null);
  const readingAuthor = useRef<HTMLInputElement>(null);
  const readingCover = useRef<HTMLInputElement>(null);

  function fillListening(hit: SongHit) {
    setRef(listeningTitle, hit.title);
    setRef(listeningArtist, hit.artist);
    setRef(listeningCover, hit.artwork);
  }

  function fillReading(hit: BookHit) {
    setRef(readingTitle, hit.title);
    setRef(readingAuthor, hit.author);
    setRef(readingCover, hit.cover ?? "");
  }

  return (
    <form
      action={saveNowAction}
      className="mt-lg flex max-w-prose flex-col gap-lg"
    >
      <div className="flex flex-col gap-md">
        <NowSearch kind="song" label="Buscar canción…" onPick={fillListening} />
        <fieldset className="flex flex-col gap-md">
          <legend className="label mb-xs">Escuchando</legend>
          <Field label="Disco / canción">
            <input
              ref={listeningTitle}
              name="listeningTitle"
              defaultValue={values.listeningTitle}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Artista">
            <input
              ref={listeningArtist}
              name="listeningArtist"
              defaultValue={values.listeningArtist}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Portada (URL, opcional)">
            <input
              ref={listeningCover}
              name="listeningCover"
              defaultValue={values.listeningCover}
              className={inputClass}
            />
          </Field>
        </fieldset>
      </div>

      <div className="flex flex-col gap-md">
        <NowSearch kind="book" label="Buscar libro…" onPick={fillReading} />
        <fieldset className="flex flex-col gap-md">
          <legend className="label mb-xs">Leyendo</legend>
          <Field label="Libro">
            <input
              ref={readingTitle}
              name="readingTitle"
              defaultValue={values.readingTitle}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Autor">
            <input
              ref={readingAuthor}
              name="readingAuthor"
              defaultValue={values.readingAuthor}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Portada (URL, opcional)">
            <input
              ref={readingCover}
              name="readingCover"
              defaultValue={values.readingCover}
              className={inputClass}
            />
          </Field>
        </fieldset>
      </div>

      <div>
        <SubmitButton>Guardar y publicar</SubmitButton>
      </div>
    </form>
  );
}

function setRef(ref: RefObject<HTMLInputElement | null>, value: string): void {
  if (ref.current) ref.current.value = value;
}
