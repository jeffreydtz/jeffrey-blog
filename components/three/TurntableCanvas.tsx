"use client";

import { useEffect, useRef } from "react";
import type { VinylRecord } from "@/lib/vinyl-data";
import type { createTurntableScene } from "./TurntableScene";

/**
 * Lienzo WebGL del tocadiscos. Se carga con next/dynamic({ ssr: false })
 * desde Turntable; Three.js entra recién cuando el host se acerca al viewport.
 */
export function TurntableCanvas({
  record,
  onFailure,
}: {
  record: VinylRecord;
  onFailure: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createTurntableScene> | null>(null);
  const recordRef = useRef(record);
  const failRef = useRef(onFailure);
  recordRef.current = record;
  failRef.current = onFailure;

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        void import("./TurntableScene")
          .then(({ createTurntableScene }) => {
            if (cancelled || !host.current) return;
            scene.current = createTurntableScene(
              host.current,
              recordRef.current,
              () => failRef.current(),
            );
          })
          .catch(() => {
            if (!cancelled) failRef.current();
          });
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);
    return () => {
      cancelled = true;
      observer.disconnect();
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => {
    scene.current?.setRecord(record);
  }, [record]);

  return <div ref={host} aria-hidden="true" className="turntable-scene" />;
}
