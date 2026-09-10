"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useState } from "react";
import { ui } from "@/lib/ui";
import type { VinylRecord } from "@/lib/vinyl-data";

const TurntableCanvas = dynamic(
  () => import("./TurntableCanvas").then((mod) => mod.TurntableCanvas),
  { ssr: false },
);

function Cover({ src }: { src: string | null }) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- portada remota de host de terceros; sin remotePatterns comodín (convención de la casa)
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className="size-xl shrink-0 rounded-subtle border border-hairline object-cover"
    />
  );
}

function Details({ record }: { record: VinylRecord }) {
  return (
    <>
      <p className="label text-ink-secondary">
        {record.source === "now" ? ui.vinyl.nowPlaying : ui.vinyl.crate}
      </p>
      <div className="mt-sm flex items-start gap-sm">
        <Cover src={record.coverUrl} />
        <div className="min-w-0">
          <h3 className="font-display text-display-md text-ink">
            {record.title}
          </h3>
          <p className="mt-xs text-body text-ink-secondary">{record.artist}</p>
        </div>
      </div>
      {record.note ? (
        <p className="mt-md text-body-sm text-ink-secondary">{record.note}</p>
      ) : null}
      {record.spotifyUrl || record.appleUrl ? (
        <p className="mt-md flex flex-wrap gap-md">
          {record.spotifyUrl ? (
            <a
              href={record.spotifyUrl}
              className="link-underline inline-flex min-h-[var(--control-target)] items-center text-body-sm text-ink-secondary"
            >
              {ui.vinyl.openSpotify}
            </a>
          ) : null}
          {record.appleUrl ? (
            <a
              href={record.appleUrl}
              className="link-underline inline-flex min-h-[var(--control-target)] items-center text-body-sm text-ink-secondary"
            >
              {record.source === "now" ? ui.now.openTrack : ui.vinyl.openApple}
            </a>
          ) : null}
        </p>
      ) : null}
    </>
  );
}

export function Turntable({ records }: { records: VinylRecord[] }) {
  const detailId = useId();
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const current = records[selected];

  useEffect(() => {
    setReady(true);
  }, []);

  if (!records.length) {
    return <p className="text-body-sm text-ink-secondary">{ui.vinyl.empty}</p>;
  }

  return (
    <div className="turntable-cabinet mt-lg" data-enhanced={ready}>
      <div className="turntable-heading">
        <p className="label text-ink-secondary">{ui.vinyl.platter}</p>
        <span className="label text-ink-secondary">
          {String(records.length).padStart(2, "0")} {ui.vinyl.sides}
        </span>
      </div>
      {ready && current && !failed ? (
        <TurntableCanvas record={current} onFailure={() => setFailed(true)} />
      ) : null}
      <p className="turntable-instructions text-body-sm text-ink-secondary">
        {failed ? ui.vinyl.fallback : ui.vinyl.instructions}
      </p>
      <p className="sr-only" role="status">
        {ready && current ? `${ui.vinyl.selected}: ${current.title}` : ""}
      </p>
      <div className="turntable-reading">
        <div className="turntable-index">
          <p className="label mb-md text-ink-secondary">{ui.vinyl.index}</p>
          <ol>
            {records.map((record, index) => (
              <li
                key={record.id}
                className="disc-entry min-w-0"
                data-selected={ready && index === selected}
              >
                {ready ? (
                  <button
                    type="button"
                    className="disc-choice"
                    aria-pressed={index === selected}
                    aria-controls={detailId}
                    aria-label={`${ui.vinyl.select}: ${record.title}`}
                    onClick={() => setSelected(index)}
                  >
                    <span className="disc-number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="disc-index-title">{record.title}</span>
                      <span className="disc-index-artist">{record.artist}</span>
                    </span>
                    <span className="disc-index-marker" aria-hidden="true">
                      ↗
                    </span>
                  </button>
                ) : (
                  <div className="disc-static-detail">
                    <Details record={record} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
        {ready && current ? (
          <section
            className="disc-detail"
            id={detailId}
            aria-label={ui.vinyl.selected}
          >
            <Details record={current} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
