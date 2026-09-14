"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState } from "react";
import { SpotifyPreview } from "./SpotifyPreview";
import { ui } from "@/lib/ui";
import { spotifyEmbedFor, type VinylRecord } from "@/lib/vinyl-data";
import { claimMusicPlayback, MUSIC_PLAYBACK_EVENT } from "@/lib/music-playback";

const TurntableCanvas = dynamic(
  () => import("./TurntableCanvas").then((mod) => mod.TurntableCanvas),
  { ssr: false },
);

export function Turntable({ records }: { records: VinylRecord[] }) {
  const owner = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  const requested = useRef(false);
  const generation = useRef(0);
  const grabWasPlaying = useRef(false);
  const [selected, setSelected] = useState(0);
  const [provider, setProvider] = useState<"apple" | "spotify" | null>(null);
  const [ready, setReady] = useState(false);
  const [canvasFailed, setCanvasFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioFailed, setAudioFailed] = useState(false);
  const current = records[selected];

  useEffect(() => {
    setReady(true);
    const audio = audioRef.current;
    function stopOther(event: Event) {
      if ((event as CustomEvent<string>).detail === owner) return;
      generation.current += 1;
      requested.current = false;
      audio?.pause();
      setPlaying(false);
      setProvider(null);
    }
    window.addEventListener(MUSIC_PLAYBACK_EVENT, stopOther);
    return () => {
      window.removeEventListener(MUSIC_PLAYBACK_EVENT, stopOther);
      generation.current += 1;
      requested.current = false;
      audio?.pause();
    };
  }, [owner]);

  function pause() {
    generation.current += 1;
    requested.current = false;
    audioRef.current?.pause();
    setPlaying(false);
  }

  function choose(index: number) {
    if (index === selected) return;
    pause();
    setProvider(null);
    setAudioFailed(false);
    setSelected(index);
  }

  function playApple(index: number) {
    const record = records[index];
    const audio = audioRef.current;
    if (!record?.previewUrl || !audio) return;
    if (index === selected && requested.current && provider === "apple") {
      pause();
      return;
    }
    pause();
    claimMusicPlayback(owner);
    setSelected(index);
    setProvider("apple");
    setAudioFailed(false);
    // Set src and invoke play within the original gesture, including on iOS.
    if (audio.getAttribute("src") !== record.previewUrl)
      audio.src = record.previewUrl;
    if (audio.ended) audio.currentTime = 0;
    requested.current = true;
    const attempt = ++generation.current;
    void audio.play().catch(() => {
      if (attempt !== generation.current) return;
      requested.current = false;
      setPlaying(false);
      setAudioFailed(true);
    });
  }

  function openSpotify(index: number) {
    const closing = index === selected && provider === "spotify";
    pause();
    claimMusicPlayback(owner);
    setSelected(index);
    setAudioFailed(false);
    setProvider(closing ? null : "spotify");
  }

  function onArmGrab() {
    grabWasPlaying.current = requested.current;
    if (!grabWasPlaying.current) playApple(selected);
  }

  function onArmRelease(onRecord: boolean, tapped: boolean) {
    if ((tapped && grabWasPlaying.current) || (!tapped && !onRecord)) pause();
  }

  if (!records.length) {
    return <p className="text-body-sm text-ink-secondary">{ui.vinyl.empty}</p>;
  }

  return (
    <div className="turntable-cabinet mt-lg" data-enhanced={ready}>
      <div className="turntable-heading">
        <p className="label text-ink-secondary">
          {ui.vinyl.platter}: {current?.title}
        </p>
        <span className="label text-ink-secondary">
          {String(records.length).padStart(2, "0")} {ui.vinyl.sides}
        </span>
      </div>
      {ready && current && !canvasFailed ? (
        <TurntableCanvas
          record={current}
          playing={playing}
          canPlay={Boolean(current.previewUrl)}
          onFailure={() => setCanvasFailed(true)}
          onArmGrab={onArmGrab}
          onArmRelease={onArmRelease}
        />
      ) : null}
      <audio
        ref={audioRef}
        preload="none"
        aria-label={
          current
            ? `${ui.vinyl.playPreview}: ${current.title}`
            : ui.vinyl.playPreview
        }
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
          if (requested.current) {
            requested.current = false;
            setPlaying(false);
            setAudioFailed(true);
          }
        }}
      />
      <p className="turntable-instructions text-body-sm text-ink-secondary">
        {canvasFailed ? ui.vinyl.fallback : ui.vinyl.instructions}
      </p>
      <p className="sr-only" role="status">
        {ready && current ? `${ui.vinyl.selected}: ${current.title}` : ""}
      </p>
      <section className="vinyl-collection" aria-label={ui.vinyl.index}>
        <div className="turntable-heading">
          <h2 className="label text-ink-secondary">{ui.vinyl.index}</h2>
          <span className="text-body-sm text-ink-secondary">
            {ui.vinyl.collectionHint}
          </span>
        </div>
        <ol className="vinyl-crate">
          {records.map((record, index) => {
            const active = index === selected;
            const spotify = spotifyEmbedFor(record);
            const spotifyUrl = record.spotifyTrackUrl ?? record.spotifyUrl;
            const appleUrl =
              record.appleUrl ??
              `https://music.apple.com/us/search?term=${encodeURIComponent(`${record.artist} ${record.title}`)}`;
            const spotifySearch = `https://open.spotify.com/search/${encodeURIComponent(`${record.artist} ${record.title}`)}`;
            const expanded = active && provider === "spotify";
            return (
              <li
                key={record.id}
                className="vinyl-sleeve"
                data-selected={active && ready}
              >
                <div className="vinyl-sleeve-label">
                  <span className="label">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="label">
                    {record.source === "now"
                      ? ui.vinyl.nowPlaying
                      : ui.vinyl.crate}
                  </span>
                </div>
                <div className="vinyl-sleeve-heading">
                  {record.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- official metadata; no broad remote image proxy.
                    <img
                      src={record.coverUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="vinyl-cover"
                    />
                  ) : (
                    <span
                      className="vinyl-cover vinyl-cover-empty"
                      aria-hidden="true"
                    >
                      {record.title.slice(0, 1)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-display text-display-sm text-ink">
                      {record.title}
                    </h3>
                    <p className="text-body-sm text-ink-secondary">
                      {record.artist}
                    </p>
                  </div>
                </div>
                {record.note ? (
                  <p className="mt-sm text-body-sm text-ink-secondary">
                    {record.note}
                  </p>
                ) : null}
                {ready ? (
                  <button
                    type="button"
                    className="vinyl-select link-underline"
                    aria-pressed={active}
                    aria-label={`${ui.vinyl.select}: ${record.title}`}
                    onClick={() => choose(index)}
                  >
                    {active ? ui.vinyl.selected : ui.vinyl.select}
                  </button>
                ) : null}
                <div className="vinyl-preview-options">
                  {ready && record.previewUrl ? (
                    <button
                      type="button"
                      className="vinyl-preview-button"
                      aria-pressed={active && playing}
                      aria-label={`${active && playing ? ui.vinyl.pausePreview : ui.vinyl.playPreview} Apple Music: ${record.title}`}
                      onClick={() => playApple(index)}
                    >
                      {active && playing
                        ? ui.vinyl.pausePreview
                        : ui.vinyl.applePreview}
                    </button>
                  ) : (
                    <a className="vinyl-preview-button" href={appleUrl}>
                      {ui.vinyl.openApple}
                    </a>
                  )}
                  {ready && spotify ? (
                    <button
                      type="button"
                      className="vinyl-preview-button"
                      aria-expanded={expanded}
                      aria-controls={`${owner}-spotify-${index}`}
                      onClick={() => openSpotify(index)}
                    >
                      {expanded
                        ? ui.vinyl.closeSpotify
                        : ui.vinyl.spotifyPreview}
                    </button>
                  ) : (
                    <a
                      className="vinyl-preview-button"
                      href={spotifyUrl ?? spotifySearch}
                    >
                      {spotifyUrl ? ui.vinyl.openSpotify : ui.vinyl.findSpotify}
                    </a>
                  )}
                </div>
                {active && provider === "apple" ? (
                  <div className="mt-sm">
                    <p
                      role="status"
                      className="text-body-sm text-ink-secondary"
                    >
                      {audioFailed ? ui.now.previewError : ui.vinyl.appleCredit}
                    </p>
                    <a
                      href={appleUrl}
                      className="link-underline text-body-sm text-ink-secondary"
                    >
                      {ui.vinyl.openApple}
                    </a>
                  </div>
                ) : null}
                {expanded && spotify ? (
                  <div
                    id={`${owner}-spotify-${index}`}
                    className="vinyl-provider"
                  >
                    <SpotifyPreview
                      key={`${record.id}-${spotify.id}`}
                      spotify={spotify}
                      title={record.title}
                      url={spotifyUrl!}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
