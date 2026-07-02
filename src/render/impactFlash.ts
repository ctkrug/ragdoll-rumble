import type { Vec2 } from "../physics/vec2";

export interface ImpactFlashState {
  /** Seconds of flash left to play out. */
  timeRemaining: number;
  /** World-space position the flash is centered on. */
  position: Vec2;
}

/** A quick, bright pulse at the point of contact — per docs/DESIGN.md's 60-140ms game-feedback token. */
const FLASH_DURATION = 0.1;
const MAX_RADIUS = 26;

export function createFlashState(): ImpactFlashState {
  return { timeRemaining: 0, position: { x: 0, y: 0 } };
}

/** Starts (or restarts) a flash centered on `position`. */
export function triggerFlash(state: ImpactFlashState, position: Vec2): void {
  state.timeRemaining = FLASH_DURATION;
  state.position = position;
}

export function updateFlash(state: ImpactFlashState, dt: number): void {
  state.timeRemaining = Math.max(0, state.timeRemaining - dt);
}

/**
 * The flash's current opacity (0..1) and radius, decaying as it burns out —
 * a growing, fading burst rather than a static dot. Zero opacity once idle.
 */
export function flashVisual(state: ImpactFlashState): { opacity: number; radius: number } {
  if (state.timeRemaining <= 0) return { opacity: 0, radius: 0 };

  const progress = 1 - state.timeRemaining / FLASH_DURATION;
  return { opacity: 1 - progress, radius: MAX_RADIUS * progress };
}
