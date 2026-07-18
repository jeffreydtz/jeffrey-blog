"use client";

import { useState, type ReactNode } from "react";
import { ScrollReveal } from "@/components/scroll/ScrollReveal";
import { useSound } from "@/components/scroll/SoundProvider";
import { SoundToggle } from "@/components/scroll/SoundToggle";
import { ui } from "@/lib/ui";

/**
 * Escenario del laboratorio (/lab, dev-only): remonta ScrollReveal con un
 * key bump para repetir la animación de pergamino cuantas veces haga falta.
 * "Repetir" también dispara playPageTurn() — simula la entrada a un post,
 * que es exactamente como fase 5 consumirá el hook.
 */
export function LabStage({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  const [runId, setRunId] = useState(0);
  const { playPageTurn } = useSound();

  function replay() {
    setRunId((n) => n + 1);
    playPageTurn();
  }

  return (
    <div className="mx-auto w-full max-w-page px-lg py-xl">
      <div className="flex flex-wrap items-center justify-between gap-x-lg gap-y-sm pb-lg">
        <div>
          <p className="label">{ui.lab.title}</p>
          <p className="mt-2xs text-body-sm text-ink-muted">
            {ui.lab.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-md">
          <SoundToggle />
          <button
            type="button"
            onClick={replay}
            className="label link-underline py-sm text-ink-secondary transition-colors hover:text-ink"
          >
            {ui.lab.replay}
          </button>
        </div>
      </div>
      <div className="hairline mb-2xl" />
      <ScrollReveal key={runId} header={header} className="mx-auto max-w-prose">
        {children}
      </ScrollReveal>
    </div>
  );
}
