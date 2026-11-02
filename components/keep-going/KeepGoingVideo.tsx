"use client";

import { useEffect, useRef } from "react";

/**
 * Video de la galería: muted + loop, se reproduce al entrar en vista.
 * Click o tecla pausa/reanuda. Bajo reduced-motion queda el poster hasta
 * una acción explícita.
 */
export function KeepGoingVideo({
  src,
  poster,
  width,
  height,
  label,
}: {
  src: string;
  poster: string;
  width: number;
  height: number;
  label: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void el.play().catch(() => {
            /* autoplay bloqueado: el click del usuario sigue disponible */
          });
        } else {
          el.pause();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      width={width}
      height={height}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
      className="keep-going-media"
      onClick={(event) => {
        const video = event.currentTarget;
        if (video.paused) void video.play();
        else video.pause();
      }}
    />
  );
}
