import type { VerletPoint } from "./point";
import { sub, length, scale } from "./vec2";

export interface DistanceConstraint {
  a: VerletPoint;
  b: VerletPoint;
  restLength: number;
  /** 0 = no correction, 1 = fully rigid in a single pass. */
  stiffness: number;
}

export function createDistanceConstraint(
  a: VerletPoint,
  b: VerletPoint,
  stiffness = 1,
): DistanceConstraint {
  return { a, b, restLength: length(sub(b.pos, a.pos)), stiffness };
}

/**
 * Pushes both endpoints toward restLength, splitting the correction by inverse
 * mass (pinned points don't move, so an unpinned partner absorbs the full delta).
 */
export function satisfyDistanceConstraint(constraint: DistanceConstraint): void {
  const { a, b, restLength, stiffness } = constraint;
  const delta = sub(b.pos, a.pos);
  const dist = length(delta);
  if (dist === 0) return;

  const diff = ((dist - restLength) / dist) * stiffness;
  const correction = scale(delta, diff * 0.5);

  if (!a.pinned && !b.pinned) {
    a.pos = { x: a.pos.x + correction.x, y: a.pos.y + correction.y };
    b.pos = { x: b.pos.x - correction.x, y: b.pos.y - correction.y };
  } else if (!a.pinned) {
    a.pos = { x: a.pos.x + correction.x * 2, y: a.pos.y + correction.y * 2 };
  } else if (!b.pinned) {
    b.pos = { x: b.pos.x - correction.x * 2, y: b.pos.y - correction.y * 2 };
  }
}
