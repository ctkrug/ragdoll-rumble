import { type Vec2, add, sub, scale } from "./vec2";

export interface VerletPoint {
  pos: Vec2;
  prevPos: Vec2;
  pinned: boolean;
}

export function createPoint(pos: Vec2, pinned = false): VerletPoint {
  return { pos: { ...pos }, prevPos: { ...pos }, pinned };
}

/**
 * Integrates one point via position Verlet: velocity is implicit (pos - prevPos),
 * so damping and impulses can be applied by nudging pos directly with no separate
 * velocity field to keep in sync.
 */
export function integratePoint(
  point: VerletPoint,
  gravity: Vec2,
  damping: number,
  dt: number,
): void {
  if (point.pinned) return;

  const velocity = scale(sub(point.pos, point.prevPos), damping);
  const nextPos = add(add(point.pos, velocity), scale(gravity, dt * dt));

  point.prevPos = point.pos;
  point.pos = nextPos;
}
