import type { Vec2 } from "../physics/vec2";

export interface ShakeState {
  /** Seconds of shake left to play out. */
  timeRemaining: number;
  /** This shake's peak amplitude in px, captured at trigger time. */
  amplitude: number;
}

/** Per docs/DESIGN.md's motion tokens: screen shake on impact is <=120ms and <=6px. */
const SHAKE_DURATION = 0.12;
const MAX_AMPLITUDE = 6;

export function createShakeState(): ShakeState {
  return { timeRemaining: 0, amplitude: 0 };
}

/** Starts (or restarts) a shake at the given peak amplitude, clamped to the design token's ceiling. */
export function triggerShake(state: ShakeState, amplitude: number = MAX_AMPLITUDE): void {
  state.timeRemaining = SHAKE_DURATION;
  state.amplitude = Math.min(amplitude, MAX_AMPLITUDE);
}

export function updateShake(state: ShakeState, dt: number): void {
  state.timeRemaining = Math.max(0, state.timeRemaining - dt);
}

/**
 * A small random per-axis offset while a shake is playing out, linearly
 * decaying to zero as `timeRemaining` runs out; always zero once idle or
 * when the caller reports `prefers-reduced-motion`.
 */
export function shakeOffset(state: ShakeState, reducedMotion: boolean): Vec2 {
  if (reducedMotion || state.timeRemaining <= 0) return { x: 0, y: 0 };

  const decay = state.timeRemaining / SHAKE_DURATION;
  const magnitude = state.amplitude * decay;
  return {
    x: (Math.random() * 2 - 1) * magnitude,
    y: (Math.random() * 2 - 1) * magnitude,
  };
}
