/**
 * Easter egg "keep going": ↑ → ↑ → (ArrowUp, ArrowRight, ArrowUp, ArrowRight)
 * and the same pattern as swipes. Pure helpers so the listener stays thin
 * and the sequence is unit-tested without a DOM.
 */

export const KEEP_GOING_PATH = "/keep-going";
export const KEEP_GOING_SEQUENCE = ["up", "right", "up", "right"] as const;
export const KEEP_GOING_IDLE_MS = 2000;
export const KEEP_GOING_SWIPE_THRESHOLD = 56;

export type KeepGoingStep = (typeof KEEP_GOING_SEQUENCE)[number];

/** Map a KeyboardEvent.key to a sequence step, or null if it is not an arrow. */
export function keyToStep(key: string): string | null {
  if (key === "ArrowUp") return "up";
  if (key === "ArrowRight") return "right";
  if (key === "ArrowDown") return "down";
  if (key === "ArrowLeft") return "left";
  return null;
}

/**
 * Advance or reset the Konami-style index.
 * A matching step increments; a step equal to the first token restarts at 1;
 * anything else returns 0.
 */
export function advanceSequence(
  currentIndex: number,
  input: string,
  sequence: readonly string[] = KEEP_GOING_SEQUENCE,
): number {
  if (input === sequence[currentIndex]) return currentIndex + 1;
  if (input === sequence[0]) return 1;
  return 0;
}

export function swipeDirection(
  dx: number,
  dy: number,
  threshold: number = KEEP_GOING_SWIPE_THRESHOLD,
): string | null {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < threshold && absY < threshold) return null;
  if (absX > absY) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

export function isModifierKey(key: string): boolean {
  return (
    key === "Shift" || key === "Control" || key === "Alt" || key === "Meta"
  );
}
