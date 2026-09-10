"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import type { VinylRecord } from "@/lib/vinyl-data";
import type { TurntableHandle } from "./TurntableScene";

const TAP_PX = 12;

/**
 * Lienzo WebGL del tocadiscos. Se carga con next/dynamic({ ssr: false })
 * desde Turntable; Three.js entra recién cuando el host se acerca al viewport.
 * El hit del brazo es un overlay 2D (Safari: play() en el pointerdown).
 */
export function TurntableCanvas({
  record,
  playing,
  canPlay,
  onFailure,
  onArmGrab,
  onArmRelease,
}: {
  record: VinylRecord;
  playing: boolean;
  canPlay: boolean;
  onFailure: () => void;
  onArmGrab: () => void;
  onArmRelease: (onRecord: boolean, tapped: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<TurntableHandle | null>(null);
  const recordRef = useRef(record);
  const playingRef = useRef(playing);
  const failRef = useRef(onFailure);
  const grabRef = useRef(onArmGrab);
  const releaseRef = useRef(onArmRelease);
  const drag = useRef<{ x: number; y: number } | null>(null);
  recordRef.current = record;
  playingRef.current = playing;
  failRef.current = onFailure;
  grabRef.current = onArmGrab;
  releaseRef.current = onArmRelease;

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
            scene.current.setPlaying(playingRef.current);
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

  useEffect(() => {
    if (!drag.current) scene.current?.setPlaying(playing);
  }, [playing]);

  function onRecordAt(clientX: number, clientY: number) {
    const rect = host.current?.getBoundingClientRect();
    if (!rect) return false;
    return (
      scene.current?.dragTo(clientX, clientY, rect) ??
      (clientX - rect.left) / rect.width < 0.55
    );
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!canPlay || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.grabbing = "true";
    drag.current = { x: event.clientX, y: event.clientY };
    scene.current?.beginDrag();
    grabRef.current();
    onRecordAt(event.clientX, event.clientY);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    onRecordAt(event.clientX, event.clientY);
  }

  function endPointer(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const start = drag.current;
    drag.current = null;
    event.currentTarget.removeAttribute("data-grabbing");
    const tapped =
      Math.hypot(event.clientX - start.x, event.clientY - start.y) < TAP_PX;
    const onRecord = scene.current
      ? scene.current.endDrag()
      : onRecordAt(event.clientX, event.clientY);
    releaseRef.current(onRecord, tapped);
  }

  return (
    <div
      ref={host}
      aria-hidden="true"
      className="turntable-scene"
      data-playing={playing}
      data-can-play={canPlay}
    >
      {canPlay ? (
        <div
          className="turntable-arm-hit"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
        />
      ) : null}
    </div>
  );
}
