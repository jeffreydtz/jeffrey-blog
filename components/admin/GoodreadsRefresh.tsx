"use client";

import { useActionState } from "react";
import { refreshGoodreadsAction } from "@/app/admin/goodreads-actions";
import type { GoodreadsRefreshState } from "@/lib/admin/goodreads-refresh";

const initialState: GoodreadsRefreshState = { status: "idle", message: "" };

export function GoodreadsRefresh() {
  const [state, action, pending] = useActionState(
    refreshGoodreadsAction,
    initialState,
  );
  return (
    <section
      className="hairline mt-lg max-w-prose pt-lg"
      aria-labelledby="goodreads-heading"
    >
      <h2
        id="goodreads-heading"
        className="font-display text-display-sm text-ink"
      >
        Lecturas de Goodreads
      </h2>
      <p className="mt-sm text-body-sm text-ink-secondary">
        Actualizá el libro del footer y los leídos del gabinete desde tu perfil
        público. El botón guarda las lecturas y solicita su publicación.
      </p>
      <form
        action={action}
        className="mt-md flex flex-wrap gap-sm"
        aria-busy={pending}
      >
        <button
          type="submit"
          name="intent"
          value="refresh"
          disabled={pending}
          className="label cursor-pointer border border-hairline bg-paper-raised px-md py-sm text-ink transition-colors hover:bg-paper focus:outline focus:outline-1 focus:outline-ink disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Actualizando…" : "Actualizar Goodreads"}
        </button>
        {state.canPublish && (
          <button
            type="submit"
            name="intent"
            value="publish"
            disabled={pending}
            className="label cursor-pointer border border-hairline bg-paper px-md py-sm text-ink transition-colors hover:bg-paper-raised focus:outline focus:outline-1 focus:outline-ink disabled:cursor-wait disabled:opacity-50"
          >
            Reintentar publicación
          </button>
        )}
      </form>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-sm text-body-sm text-ink-secondary"
      >
        {pending ? (
          <p>
            Consultando y guardando las lecturas; después se solicita la
            publicación. Puede tardar unos segundos.
          </p>
        ) : (
          <>
            {state.message && <p>{state.message}</p>}
            {state.currentTitle && (
              <p className="mt-xs">Lectura guardada: {state.currentTitle}.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
