"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { stripLocale } from "@/lib/i18n/routing";
import {
  KEEP_GOING_IDLE_MS,
  KEEP_GOING_PATH,
  KEEP_GOING_SEQUENCE,
  advanceSequence,
  isModifierKey,
  keyToStep,
  swipeDirection,
} from "@/lib/keep-going-sequence";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Listener global del easter egg: ↑ → ↑ → en teclado, el mismo gesto en swipe.
 * Vive en el layout para estar en todas las páginas. Ignora campos editables.
 */
export function KeepGoingTrigger() {
  const { ui } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [veiled, setVeiled] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<number>(0);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const unveilRef = useRef<number>(0);
  const pathnameRef = useRef(pathname);
  const reduceMotionRef = useRef(false);

  pathnameRef.current = pathname;

  const reset = useCallback(() => {
    indexRef.current = 0;
    window.clearTimeout(timerRef.current);
  }, []);

  const go = useCallback(() => {
    const already = stripLocale(pathnameRef.current ?? "") === KEEP_GOING_PATH;
    const navigate = () => {
      if (!already) router.push(KEEP_GOING_PATH);
    };

    if (reduceMotionRef.current) {
      navigate();
      return;
    }

    setVeiled(true);
    window.clearTimeout(unveilRef.current);
    unveilRef.current = window.setTimeout(() => {
      navigate();
      unveilRef.current = window.setTimeout(() => setVeiled(false), 520);
    }, 380);
  }, [router]);

  const bump = useCallback(
    (step: string) => {
      const next = advanceSequence(indexRef.current, step);
      indexRef.current = next === KEEP_GOING_SEQUENCE.length ? 0 : next;
      window.clearTimeout(timerRef.current);
      if (next === KEEP_GOING_SEQUENCE.length) {
        go();
        return;
      }
      if (next === 1) router.prefetch(KEEP_GOING_PATH);
      if (next > 0) {
        timerRef.current = window.setTimeout(reset, KEEP_GOING_IDLE_MS);
      }
    },
    [go, reset, router],
  );

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = motion.matches;
    const onMotion = () => {
      reduceMotionRef.current = motion.matches;
    };
    motion.addEventListener("change", onMotion);
    return () => motion.removeEventListener("change", onMotion);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isModifierKey(event.key)) return;
      if (isEditableTarget(event.target)) return;
      const step = keyToStep(event.key);
      if (step === null) {
        reset();
        return;
      }
      bump(step);
    }

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1 || isEditableTarget(event.target)) {
        startRef.current = null;
        return;
      }
      startRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }

    function onTouchEnd(event: TouchEvent) {
      const start = startRef.current;
      startRef.current = null;
      if (!start || event.changedTouches.length !== 1) return;
      if (isEditableTarget(event.target)) return;
      const touch = event.changedTouches[0];
      const direction = swipeDirection(
        touch.clientX - start.x,
        touch.clientY - start.y,
      );
      if (direction) bump(direction);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.clearTimeout(timerRef.current);
    };
  }, [bump, reset]);

  useEffect(() => {
    return () => window.clearTimeout(unveilRef.current);
  }, []);

  return (
    <div
      className="keep-going-veil print-hidden"
      data-visible={veiled ? "true" : "false"}
      aria-hidden="true"
    >
      {ui.keepGoing.title}
    </div>
  );
}
