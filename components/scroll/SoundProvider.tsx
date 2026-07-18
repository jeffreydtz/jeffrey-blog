"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** URL pública del foley (el archivo NO se shipea; ver public/sounds/README.md). */
const PAGE_TURN_SRC = "/sounds/page-turn.mp3";
/** Volumen discreto: el sonido acompaña, nunca protagoniza. */
const PAGE_TURN_VOLUME = 0.35;
/** Clave de persistencia (spec FR-003): "on" | "off", default off. */
const STORAGE_KEY = "sound";

export interface SoundContextValue {
  /** true solo si public/sounds/page-turn.mp3 existía en build. */
  available: boolean;
  /** Preferencia del visitante (default off, persiste en localStorage). */
  enabled: boolean;
  toggle: () => void;
  /**
   * Reproduce el foley de vuelta de página. No-op si el asset falta o el
   * sonido está apagado. Llamar SOLO desde interacciones explícitas de
   * navegación (links prev/next, entrada a post) — nunca autoplay.
   */
  playPageTurn: () => void;
}

const noop = () => {};

const SoundContext = createContext<SoundContextValue>({
  available: false,
  enabled: false,
  toggle: noop,
  playPageTurn: noop,
});

/** Hook de consumo para fase 5: const { enabled, toggle, playPageTurn } = useSound(). */
export function useSound(): SoundContextValue {
  return useContext(SoundContext);
}

/**
 * Provider global de sonido (app/layout.tsx). `available` llega del servidor
 * (lib/sound.ts, fs.existsSync en build) — sin fetches de detección en runtime.
 *
 * Hidratación: el primer render siempre es enabled=false (igual que el SSR);
 * la preferencia guardada se restaura en efecto. El Audio se crea recién
 * cuando el sonido queda habilitado (lazy preload) — nunca en page load para
 * visitantes con el default off.
 */
export function SoundProvider({
  available,
  children,
}: {
  available: boolean;
  children: ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Restaurar preferencia persistida (post-hidratación: sin mismatch).
  useEffect(() => {
    if (!available) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "on") setEnabled(true);
    } catch {
      /* localStorage bloqueado: queda el default off */
    }
  }, [available]);

  // Preload perezoso: primera vez que el sonido pasa a habilitado.
  useEffect(() => {
    if (!available || !enabled || audioRef.current !== null) return;
    const audio = new Audio(PAGE_TURN_SRC);
    audio.preload = "auto";
    audio.volume = PAGE_TURN_VOLUME;
    audioRef.current = audio;
  }, [available, enabled]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
      } catch {
        /* sin persistencia: el toggle igual aplica a esta vista */
      }
      return next;
    });
  }, []);

  const playPageTurn = useCallback(() => {
    if (!available || !enabled) return;
    const audio = audioRef.current;
    if (audio === null) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      /* bloqueado por el navegador o asset corrupto: silencio elegante */
    });
  }, [available, enabled]);

  const value = useMemo<SoundContextValue>(
    () => ({ available, enabled, toggle, playPageTurn }),
    [available, enabled, toggle, playPageTurn],
  );

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}
