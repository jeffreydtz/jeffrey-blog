"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { ui } from "@/lib/ui";
import { spotifyEmbedFor, type VinylRecord } from "@/lib/vinyl-data";

const TurntableCanvas = dynamic(
  () => import("./TurntableCanvas").then((mod) => mod.TurntableCanvas),
  { ssr: false },
);

const EMPTY_RECORD: VinylRecord = {
  id: "",
  title: "",
  artist: "",
  coverUrl: null,
  previewUrl: null,
  source: "crate",
};

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

type VinylPlayback = {
  playing: boolean;
  failed: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  playFromGesture: () => void;
  pause: () => void;
  toggle: () => void;
  onPlaying: () => void;
  onPause: () => void;
  onEnded: () => void;
  onError: () => void;
};

function useVinylPlayback(record: VinylRecord): VinylPlayback {
  const audioRef = useRef<HTMLAudioElement>(null);
  const requested = useRef(false);
  const generation = useRef(0);
  const [session, setPlaySession] = useState({
    id: record.id,
    playing: false,
    failed: false,
  });
  if (session.id !== record.id) {
    requested.current = false;
    setPlaySession({ id: record.id, playing: false, failed: false });
  }
  const playing = session.id === record.id && session.playing;
  const failed = session.id === record.id && session.failed;

  useEffect(() => {
    requested.current = false;
    generation.current += 1;
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    if (record.previewUrl) {
      audio.src = record.previewUrl;
    } else {
      audio.removeAttribute("src");
      audio.load();
    }
    return () => {
      generation.current += 1;
      requested.current = false;
      audio.pause();
    };
  }, [record.id, record.previewUrl]);

  function setPlaying(next: boolean) {
    setPlaySession((current) =>
      current.id === record.id ? { ...current, playing: next } : current,
    );
  }

  function setFailed(next: boolean) {
    setPlaySession((current) =>
      current.id === record.id ? { ...current, failed: next } : current,
    );
  }

  function playFromGesture() {
    const audio = audioRef.current;
    if (!audio || !record.previewUrl) return;
    requested.current = true;
    const attempt = ++generation.current;
    setFailed(false);
    setPlaying(true);
    if (audio.ended) audio.currentTime = 0;
    const attemptPlay = audio.play();
    if (attemptPlay) {
      void attemptPlay.catch(() => {
        if (attempt !== generation.current) return;
        requested.current = false;
        setPlaying(false);
        setFailed(true);
      });
    }
  }

  function pause() {
    requested.current = false;
    audioRef.current?.pause();
  }

  function toggle() {
    if (requested.current) pause();
    else playFromGesture();
  }

  function onPlaying() {
    if (requested.current) setPlaying(true);
    else audioRef.current?.pause();
  }

  function onPause() {
    setPlaying(false);
  }

  function onEnded() {
    requested.current = false;
    setPlaying(false);
  }

  function onError() {
    requested.current = false;
    setPlaying(false);
    setFailed(true);
  }

  return {
    playing,
    failed,
    audioRef,
    playFromGesture,
    pause,
    toggle,
    onPlaying,
    onPause,
    onEnded,
    onError,
  };
}

/** Preview iTunes (brazo + botón) y, si hay URL, embed compacto de Spotify. */
function VinylListen({
  record,
  playback,
}: {
  record: VinylRecord;
  playback: VinylPlayback;
}) {
  const spotify = spotifyEmbedFor(record);
  if (!record.previewUrl && !spotify) return null;

  return (
    <div className="mt-md">
      {record.previewUrl ? (
        <>
          <button
            type="button"
            className="link-underline inline-flex min-h-[var(--control-target)] items-center text-body-sm text-ink-secondary"
            aria-pressed={playback.playing}
            aria-label={`${playback.playing ? ui.vinyl.pausePreview : ui.vinyl.playPreview}: ${record.title} — ${record.artist}`}
            onClick={() => playback.toggle()}
          >
            {playback.playing ? ui.vinyl.pausePreview : ui.vinyl.playPreview}
          </button>
          <p className="mt-xs text-body-sm text-ink-secondary">
            {ui.vinyl.preview}
          </p>
          <p role="status" className="text-body-sm text-ink-secondary">
            {playback.failed ? ui.now.previewError : ""}
          </p>
        </>
      ) : null}
      {spotify ? (
        <div
          className="vinyl-embed print-hidden mt-md overflow-hidden rounded-subtle border border-hairline bg-paper-raised"
          style={{ height: 152 }}
        >
          <iframe
            src={`https://open.spotify.com/embed/${spotify.kind}/${spotify.id}`}
            title={`${ui.mdx.spotifyTitle}: ${record.title}`}
            loading="lazy"
            className="h-full w-full border-0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        </div>
      ) : null}
    </div>
  );
}

function Details({
  record,
  listen = false,
  playback,
}: {
  record: VinylRecord;
  listen?: boolean;
  playback?: VinylPlayback;
}) {
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
      {record.spotifyUrl || record.spotifyTrackUrl || record.appleUrl ? (
        <p className="mt-md flex flex-wrap gap-md">
          {record.spotifyUrl || record.spotifyTrackUrl ? (
            <a
              href={record.spotifyTrackUrl ?? record.spotifyUrl}
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
              {ui.vinyl.openApple}
            </a>
          ) : null}
        </p>
      ) : null}
      {listen && playback ? (
        <VinylListen record={record} playback={playback} />
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
  const playback = useVinylPlayback(current ?? EMPTY_RECORD);
  const playingRef = useRef(false);
  const grabWasPlaying = useRef(false);
  playingRef.current = playback.playing;

  useEffect(() => {
    setReady(true);
  }, []);

  function onArmGrab() {
    grabWasPlaying.current = playingRef.current;
    playback.playFromGesture();
  }

  function onArmRelease(onRecord: boolean, tapped: boolean) {
    if (tapped) {
      if (grabWasPlaying.current) playback.pause();
      return;
    }
    if (!onRecord) playback.pause();
  }

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
        <TurntableCanvas
          record={current}
          playing={playback.playing}
          canPlay={Boolean(current.previewUrl)}
          onFailure={() => setFailed(true)}
          onArmGrab={onArmGrab}
          onArmRelease={onArmRelease}
        />
      ) : null}
      {ready && current?.previewUrl ? (
        <audio
          ref={playback.audioRef}
          src={current.previewUrl}
          preload="none"
          aria-label={`${ui.vinyl.playPreview}: ${current.title}`}
          onPlaying={playback.onPlaying}
          onPause={playback.onPause}
          onEnded={playback.onEnded}
          onError={playback.onError}
        />
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
            <Details record={current} listen playback={playback} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
