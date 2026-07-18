import { now } from "@/lib/now";
import { ui } from "@/lib/ui";

/**
 * Widget "Ahora" (T17, FR-005) — qué estoy escuchando y leyendo, editado a
 * mano en lib/now.ts. Server component puro: mismo tratamiento tipográfico
 * que el resto de la metadata del footer (.label + body-sm ink-secondary /
 * ink-muted), donde vive su único mount.
 */
export function NowWidget() {
  return (
    <div className="flex flex-col gap-lg sm:flex-row sm:gap-2xl">
      <div>
        <p className="label">{ui.now.listening}</p>
        <p className="mt-xs text-body-sm text-ink-secondary">
          {now.listening.title}
          <span className="text-ink-muted"> — {now.listening.artist}</span>
        </p>
      </div>
      <div>
        <p className="label">{ui.now.reading}</p>
        <p className="mt-xs text-body-sm text-ink-secondary">
          {now.reading.title}
          <span className="text-ink-muted"> — {now.reading.author}</span>
        </p>
      </div>
    </div>
  );
}
