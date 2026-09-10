"use client";

import { useEffect, useRef, useState } from "react";
import { ui } from "@/lib/ui";

type Props = {
  title: string;
  artist: string;
  coverUrl: string | null;
  trackUrl: string | null;
  previewUrl: string | null;
};

export function MusicPreview({
  title,
  artist,
  coverUrl,
  trackUrl,
  previewUrl,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const requested = useRef(false);
  const generation = useRef(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setReady(true);
    const audio = audioRef.current;
    if (audio && previewUrl) audio.src = previewUrl;
    return () => {
      generation.current += 1;
      requested.current = false;
      audio?.pause();
      audio?.removeAttribute("src");
      audio?.load();
    };
  }, [previewUrl]);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    requested.current = !requested.current;
    const attempt = ++generation.current;
    if (!requested.current) {
      audio.pause();
      return;
    }
    setFailed(false);
    try {
      if (audio.ended) audio.currentTime = 0;
      await audio.play();
      if (!requested.current) audio.pause();
    } catch {
      if (attempt !== generation.current) return;
      requested.current = false;
      setPlaying(false);
      setFailed(true);
    }
  }

  const disc = (
    <>
      <span className="music-vinyl">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- metadata oficial cacheada; sin proxy de imágenes externo.
          <img src={coverUrl} alt="" loading="lazy" decoding="async" />
        ) : null}
      </span>
      <span className="music-needle" aria-hidden="true" />
    </>
  );

  return (
    <div className="flex min-w-0 items-start gap-sm">
      {previewUrl && ready ? (
        <button
          type="button"
          className="music-disc cursor-pointer"
          data-playing={playing}
          aria-label={`${playing ? ui.now.pausePreview : ui.now.playPreview}: ${title} — ${artist}`}
          aria-pressed={playing}
          onClick={() => void toggle()}
        >
          {disc}
        </button>
      ) : coverUrl ? (
        <span className="music-disc" aria-hidden="true">
          {disc}
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="label text-ink-secondary">{ui.now.listening}</p>
        <p className="mt-xs text-body-sm text-ink-secondary">
          {title}
          <span> — {artist}</span>
        </p>
        {previewUrl ? (
          <p className="text-body-sm text-ink-secondary">{ui.now.preview}</p>
        ) : null}
        {trackUrl ? (
          <a
            href={trackUrl}
            className="link-underline inline-flex min-h-[var(--control-target)] items-center text-body-sm text-ink-secondary"
          >
            {ui.now.openTrack}
          </a>
        ) : null}
        <p role="status" className="text-body-sm text-ink-secondary">
          {failed ? ui.now.previewError : ""}
        </p>
      </div>
      {previewUrl ? (
        <audio
          ref={audioRef}
          src={previewUrl}
          preload="none"
          aria-label={`${ui.now.playPreview}: ${title}`}
          onPlaying={() => {
            if (requested.current) setPlaying(true);
            else audioRef.current?.pause();
          }}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            requested.current = false;
            setPlaying(false);
          }}
          onError={() => {
            requested.current = false;
            setPlaying(false);
            setFailed(true);
          }}
        />
      ) : null}
    </div>
  );
}
