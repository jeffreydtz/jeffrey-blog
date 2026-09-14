"use client";

import { useEffect, useRef, useState } from "react";
import { ui } from "@/lib/ui";
import type { SpotifyEmbed } from "@/lib/vinyl-data";

/** Native compact embed: a stalled request collapses to its official link. */
export function SpotifyPreview({
  spotify,
  title,
  url,
}: {
  spotify: SpotifyEmbed;
  title: string;
  url: string;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  useEffect(() => {
    if (state !== "loading") return;
    // A frame's load also fires for blocked/error pages. Spotify's own ready
    // message confirms its player booted; trust only this frame and origin.
    function onReady(event: MessageEvent) {
      if (
        event.origin === "https://open.spotify.com" &&
        event.source === frameRef.current?.contentWindow &&
        event.data?.type === "ready"
      )
        setState("ready");
    }
    window.addEventListener("message", onReady);
    const timer = window.setTimeout(() => setState("unavailable"), 12_000);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", onReady);
    };
  }, [state]);
  return (
    <>
      {state !== "unavailable" ? (
        <iframe
          ref={frameRef}
          src={`https://open.spotify.com/embed/${spotify.kind}/${spotify.id}?utm_source=generator&theme=0`}
          title={`${ui.mdx.spotifyTitle}: ${title}`}
          width="100%"
          height="152"
          className="vinyl-embed"
          onError={() => setState("unavailable")}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      ) : null}
      {state !== "ready" ? (
        <p role="status" className="text-body-sm text-ink-secondary">
          {state === "loading"
            ? ui.vinyl.spotifyLoading
            : ui.vinyl.spotifyUnavailable}
        </p>
      ) : null}
      <a href={url} className="link-underline text-body-sm text-ink-secondary">
        {ui.vinyl.openSpotify}
      </a>
    </>
  );
}
