"use client";

import { useI18n } from "@/lib/i18n/client";
import { localizedPath } from "@/lib/i18n/routing";
import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useSound } from "@/components/scroll/SoundProvider";

/**
 * Link de entrada a un post (T12, FR-003): un <Link> que dispara el foley de
 * vuelta de página al click. Se usa en listados (home, archivo, relacionados,
 * palette) — la entrada a un ensayo es "abrir el libro". No-op si el sonido
 * está apagado o el asset no existe (useSound ya lo resuelve).
 */
export function PostLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  const { locale } = useI18n();
  const { playPageTurn } = useSound();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    playPageTurn();
  }

  return (
    <Link
      {...props}
      href={
        typeof props.href === "string"
          ? localizedPath(props.href, locale)
          : props.href
      }
      onClick={handleClick}
    />
  );
}
