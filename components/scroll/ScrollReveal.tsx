"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import type { ReactNode } from "react";

/**
 * Parallax de "unrolling": dentro de los primeros PARALLAX_RANGE px de scroll,
 * el bloque `header` se desplaza hasta PARALLAX_MAX px hacia abajo — es decir,
 * se mueve a ~0.85x de la velocidad del scroll (24/150 ≈ 0.16 de rezago).
 * Clampeado: pasado el rango el offset queda fijo (el header ya salió de vista).
 */
const PARALLAX_RANGE_PX = 150;
const PARALLAX_MAX_PX = 24;

export interface ScrollRevealProps {
  /**
   * Bloque de cabecera del post (título, metadata). Recibe el parallax sutil
   * de los primeros 150px de scroll. Opcional: sin header no hay parallax.
   */
  header?: ReactNode;
  /** Contenido del post (RSC server-rendered, pasa a través sin tocar). */
  children: ReactNode;
  className?: string;
}

/**
 * Pergamino (T07, FR-003) — wrapper de entrada de post.
 *
 * - Reveal de mount: clip-path inset que se abre verticalmente desde el centro
 *   del viewport (keyframes `reveal-unroll` en globals.css, curva --ease-page,
 *   duración --duration-reveal). Es CSS puro sobre contenido ya server-rendered:
 *   arranca en el primer paint, sin flash, sin layout shift, y se re-ejecuta al
 *   remontar (key bump = replay).
 * - Bordes del rollo: dos scrims degradados (--roll-shadow) que viajan con los
 *   bordes del clip y se desvanecen al completarse el reveal.
 * - Parallax: framer-motion useScroll/useTransform sobre el slot `header`.
 * - prefers-reduced-motion: el CSS del reveal vive bajo
 *   @media (prefers-reduced-motion: no-preference) → render instantáneo;
 *   el parallax (JS) se apaga acá con useReducedMotion.
 */
export function ScrollReveal({
  header,
  children,
  className,
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const parallaxY = useTransform(
    scrollY,
    [0, PARALLAX_RANGE_PX],
    [0, PARALLAX_MAX_PX],
  );

  return (
    <div className={`scroll-reveal relative ${className ?? ""}`.trim()}>
      {header !== undefined && (
        /* Mismo elemento en SSR y cliente (sin branch de tipo → sin mismatch):
           bajo reduced-motion el offset es 0 y el transform queda inerte. */
        <motion.div style={{ y: reduceMotion ? 0 : parallaxY }}>
          {header}
        </motion.div>
      )}
      {children}
      <div
        aria-hidden="true"
        className="scroll-reveal-edge scroll-reveal-edge-top pointer-events-none absolute inset-x-0 h-lg"
      />
      <div
        aria-hidden="true"
        className="scroll-reveal-edge scroll-reveal-edge-bottom pointer-events-none absolute inset-x-0 h-lg"
      />
    </div>
  );
}
